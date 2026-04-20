import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Stars, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

const Wheat = ({ position, rotation }) => {
    const stemRef = useRef();
    const headRef = useRef();
    const offset = Math.random() * Math.PI * 2;

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (stemRef.current) {
            stemRef.current.rotation.z = Math.sin(t * 1.2 + offset) * 0.08;
        }
    });

    return (
        <group position={position} rotation={rotation}>
            <mesh ref={stemRef}>
                <cylinderGeometry args={[0.01, 0.02, 1.2]} />
                <meshStandardMaterial color="#2d5a27" />
                <mesh position={[0, 0.6, 0]} scale={[1, 0.5, 1]} ref={headRef}>
                    <sphereGeometry args={[0.12]} />
                    <meshStandardMaterial color="#f0b429" />
                </mesh>
            </mesh>
        </group>
    );
};

const Corn = ({ position, rotation }) => {
    const stalkRef = useRef();
    const offset = Math.random() * Math.PI * 2;

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (stalkRef.current) {
            stalkRef.current.rotation.z = Math.sin(t * 1.2 + offset) * 0.05;
        }
    });

    return (
        <group position={position} rotation={rotation}>
            <mesh ref={stalkRef}>
                <cylinderGeometry args={[0.03, 0.05, 2.0]} />
                <meshStandardMaterial color="#1e4d2b" />
                {[0, 1, 2, 3].map(i => (
                    <mesh key={i} position={[0, 0.4 * i + 0.5, 0]} rotation={[0, (i * Math.PI) / 2, 0.5]}>
                        <boxGeometry args={[0.5, 0.02, 0.15]} />
                        <meshStandardMaterial color="#064e3b" />
                    </mesh>
                ))}
                <mesh position={[0.1, 1.2, 0]} rotation={[0, 0, 0.3]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.4]} />
                    <meshStandardMaterial color="#fbbf24" />
                </mesh>
            </mesh>
        </group>
    );
};

const Sunflower = ({ position, rotation }) => {
    const headRef = useRef();
    const stemRef = useRef();
    const offset = Math.random() * Math.PI * 2;

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (headRef.current) {
            headRef.current.rotation.y = Math.sin(t * 0.1) * 0.3;
        }
        if (stemRef.current) {
            stemRef.current.rotation.z = Math.sin(t * 0.8 + offset) * 0.03;
        }
    });

    return (
        <group position={position} rotation={rotation}>
            <mesh ref={stemRef}>
                <cylinderGeometry args={[0.02, 0.03, 1.5]} />
                <meshStandardMaterial color="#166534" />
                <group position={[0, 0.75, 0]} ref={headRef}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.15, 0.15, 0.05]} />
                        <meshStandardMaterial color="#451a03" />
                    </mesh>
                    {[...Array(12)].map((_, i) => (
                        <mesh key={i} rotation={[Math.PI / 2, 0, (i * Math.PI * 2) / 12]} position={[Math.cos((i * Math.PI * 2) / 12) * 0.25, Math.sin((i * Math.PI * 2) / 12) * 0.25, 0]}>
                            <boxGeometry args={[0.3, 0.08, 0.02]} />
                            <meshStandardMaterial color="#fcd34d" />
                        </mesh>
                    ))}
                </group>
            </mesh>
        </group>
    );
};

const Field = () => {
    const plants = useMemo(() => {
        const items = [];
        for (let row = 0; row < 3; row++) {
            const z = (row - 1) * 2;
            for (let i = 0; i < 8; i++) {
                const x = (i - 3.5) * 2;
                const type = (row + i) % 3;
                items.push({ x, z, type });
            }
        }
        return items;
    }, []);

    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
                <planeGeometry args={[30, 10]} />
                <meshStandardMaterial color="#1a3a1a" />
            </mesh>
            {plants.map((p, i) => {
                const pos = [p.x, -0.6, p.z];
                if (p.type === 0) return <Wheat key={i} position={pos} />;
                if (p.type === 1) return <Corn key={i} position={pos} />;
                return <Sunflower key={i} position={pos} />;
            })}
        </group>
    );
};

const SceneContent = () => {
    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (state.camera) {
            state.camera.position.x = Math.sin(time * 0.05) * 0.8;
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 1.5, 6]} fov={55} />
            <fog attach="fog" args={['#0f1f0f', 8, 20]} />
            <Sky sunPosition={[100, 10, 100]} />
            <ambientLight intensity={0.4} color="#b7e4c7" />
            <directionalLight intensity={1.2} position={[5, 8, 3]} color="#fffbe6" castShadow />
            <pointLight intensity={0.6} color="#4ade80" position={[0, 3, 0]} />
            <Field />
            <Environment preset="forest" />
        </>
    );
};

const CropScene = () => {
    return (
        <div className="w-full h-full min-h-[400px]">
            <Canvas dpr={[1, 1.5]} shadows>
                <SceneContent />
            </Canvas>
        </div>
    );
};

export default CropScene;

