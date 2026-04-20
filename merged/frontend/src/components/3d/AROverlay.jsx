import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Float, MeshDistortMaterial } from '@react-three/drei';

const AROverlay = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-end p-8">
            <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/20 p-6 max-w-md animate-in slide-in-from-bottom duration-700">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-3 h-3 rounded-full bg-farm-green-400 animate-pulse" />
                    <h3 className="text-white font-display text-xl">Active Field Scan</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-farm-green-400/80">
                    <div>LAT: 20.5937° N</div>
                    <div>LNG: 78.9629° E</div>
                    <div>ALT: 452m</div>
                    <div>SAT: 12 Active</div>
                </div>
                <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-farm-green-400 w-2/3 animate-pulse" />
                </div>
            </div>
        </div>
    );
};

export default AROverlay;
