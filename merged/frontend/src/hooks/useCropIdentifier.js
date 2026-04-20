// hooks/useCropIdentifier.js
// Sends a captured image to Claude Vision API to identify the crop in the photo.
// Returns: crop name, confidence, local names (Hindi/Marathi), stage, care tips.

import { useCallback, useState } from 'react'
import { useFarmStore } from '../store/farmStore'
import { CROP_TYPES } from '../store/farmStore'
import { saveCropIdentification } from '../services/api'

// Maps Claude's English crop names → our internal crop keys
const CROP_NAME_MAP = {
  wheat: 'wheat', 'गेहूं': 'wheat', गहू: 'wheat',
  rice: 'rice', paddy: 'rice', 'चावल': 'rice', 'तांदूळ': 'rice',
  corn: 'corn', maize: 'corn', 'मक्का': 'corn', मका: 'corn',
  tomato: 'tomato', 'टमाटर': 'tomato',
  potato: 'potato', 'आलू': 'potato', बटाटा: 'potato',
  cotton: 'cotton', 'कपास': 'cotton', कापूस: 'cotton',
  soybean: 'soybean', soya: 'soybean', 'सोयाबीन': 'soybean',
  onion: 'onion', 'प्याज': 'onion', कांदा: 'onion',
}

export function useCropIdentifier() {
  const [state, setState] = useState({
    loading: false,
    result: null,   // { cropKey, cropInfo, confidence, stageName, careTips, rawName, names, allCrops }
    error: null,
  })

  const lang = useFarmStore(s => s.lang)

  const identify = useCallback(async (imageBlob) => {
    setState({ loading: true, result: null, error: null })

    try {
      // Convert blob to base64
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload  = () => res(reader.result.split(',')[1])
        reader.onerror = () => rej(new Error('Failed to read image'))
        reader.readAsDataURL(imageBlob)
      })

      const SYSTEM = `You are an expert Indian agricultural crop identification assistant.
When shown a photo of a crop or farm field, identify:
1. The exact crop (be very specific)
2. Your confidence percentage (0-100)
3. Current growth stage
4. 2-3 practical care tips for Indian farmers
5. Crop names in Hindi and Marathi

Respond ONLY with a valid JSON object, no preamble or markdown. Format:
{
  "crop": "wheat",
  "confidence": 87,
  "stage": "seedling",
  "stage_description": "Early vegetative stage, 1-3 weeks after sowing",
  "care_tips": [
    "Apply first irrigation 21 days after sowing",
    "Apply urea at 50kg/acre for nitrogen boost",
    "Watch for aphid attack on new leaves"
  ],
  "names": {
    "en": "Wheat",
    "hi": "गेहूं",
    "mr": "गहू"
  },
  "what_i_see": "Green wheat seedlings in rows, approximately 15cm tall, healthy color",
  "not_a_crop": false
}

If the image is not a crop/farm field, set not_a_crop: true and explain in what_i_see.
Use Indian farming context. All tips should be practical for small Indian farmers.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
              },
              {
                type: 'text',
                text: 'Identify this crop. Respond ONLY with JSON.',
              },
            ],
          }],
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const text = data.content?.map(b => b.text || '').join('').trim()
      // Strip any accidental markdown code fences
      const clean = text.replace(/^```json|^```|```$/gm, '').trim()
      const parsed = JSON.parse(clean)

      // Match to internal crop key
      const rawName = (parsed.crop || '').toLowerCase().trim()
      const cropKey = CROP_NAME_MAP[rawName] || Object.keys(CROP_NAME_MAP).find(k => rawName.includes(k))
      const cropInfo = cropKey ? CROP_TYPES[cropKey] : null

      const result = {
          cropKey,
          cropInfo,
          confidence: Math.round(parsed.confidence || 70),
          stageName: parsed.stage || 'unknown',
          stageDescription: parsed.stage_description || '',
          careTips: parsed.care_tips || [],
          rawName: parsed.crop,
          names: parsed.names || { en: parsed.crop, hi: parsed.crop, mr: parsed.crop },
          whatISee: parsed.what_i_see || '',
          notACrop: parsed.not_a_crop || false,
        }

      // Persist to DB (fire-and-forget)
      const gps = useFarmStore.getState().gpsPosition
      saveCropIdentification({ result, gps, assignedToPlot: null })

      setState({
        loading: false,
        result,
        error: null,
      })
    } catch (err) {
      setState({ loading: false, result: null, error: err.message || 'Identification failed' })
    }
  }, [lang])

  const reset = useCallback(() => setState({ loading: false, result: null, error: null }), [])

  return { ...state, identify, reset }
}
