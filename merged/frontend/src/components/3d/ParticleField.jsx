import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleField = ({ count = 2000 }) => {
    const points = useRef();

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return positions;
    }, [count]);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            points.current.geometry.attributes.position.array[i3 + 1] += Math.sin(time + points.current.geometry.attributes.position.array[i3]) * 0.002;
        }
        points.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.length / 3}
                    array={particles}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.015} color="#4ade80" transparent opacity={0.6} sizeAttenuation />
        </points>
    );
};

export default ParticleField;
