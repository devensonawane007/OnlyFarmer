import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Sphere, OrbitControls, Stars, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import ParticleField from './ParticleField';

const Globe = () => {
    const globeRef = useRef();
    const cloudsRef = useRef();
    const [earthTexture, cloudTexture] = useLoader(THREE.TextureLoader, [
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
    ]);

    useFrame((state, delta) => {
        if (globeRef.current) globeRef.current.rotation.y += delta * 0.05;
        if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.07;
    });

    const markers = useMemo(() => {
        const locations = [
            { lat: 20.5937, lng: 78.9629, label: "India " },
            { lat: -25.2744, lng: 133.7751, label: "Australia Farm" },
            { lat: 37.0902, lng: -95.7129, label: "USA Fields" },
            { lat: -14.235, lng: -51.9253, label: "Brazil Logistics" },
        ];

        const R = 2.05;
        return locations.map(loc => {
            const phi = (90 - loc.lat) * (Math.PI / 180);
            const theta = (loc.lng + 180) * (Math.PI / 180);
            const x = -(R * Math.sin(phi) * Math.cos(theta));
            const y = R * Math.cos(phi);
            const z = R * Math.sin(phi) * Math.sin(theta);
            return { x, y, z, label: loc.label };
        });
    }, []);

    useEffect(() => {
        return () => {
            if (globeRef.current) {
                globeRef.current.geometry.dispose();
                globeRef.current.material.dispose();
            }
        };
    }, []);

    return (
        <group>
            <Sphere ref={globeRef} args={[2, 64, 64]}>
                <meshStandardMaterial
                    map={earthTexture}
                    roughness={0.7}
                    metalness={0.4}
                    emissive="#112244"
                    emissiveIntensity={0.2}
                />
            </Sphere>
            <Sphere ref={cloudsRef} args={[2.02, 64, 64]}>
                <meshStandardMaterial
                    map={cloudTexture}
                    transparent
                    opacity={0.4}
                    depthWrite={false}
                />
            </Sphere>
            {markers.map((m, i) => (
                <mesh key={i} position={[m.x, m.y, m.z]}>
                    <cylinderGeometry args={[0.01, 0.01, 0.2]} />
                    <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={2} />
                    <Html distanceFactor={10}>
                        <div className="bg-black/80 text-farm-green-400 px-2 py-1 rounded text-[10px] whitespace-nowrap border border-farm-green-600">
                            {m.label}
                        </div>
                    </Html>
                </mesh>
            ))}
        </group>
    );
};

const GlobeScene = () => {
    return (
        <div className="w-full h-full min-h-[500px] pointer-events-none">
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]} shadows>
                <ambientLight intensity={1.5} />
                <pointLight position={[10, 10, 10]} intensity={2.5} />
                <Globe />
                <ParticleField />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
};

export default GlobeScene;
