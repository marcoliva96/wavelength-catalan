import React, { useRef, useEffect, useState } from 'react';
import './Dial.css';

const NUM_POSITIONS = 21; // 0 to 20, position 10 = center/top
const MAX_VAL = NUM_POSITIONS - 1; // 20

/**
 * Dial Component — Wavelength-style semicircle dial with ~20 discrete positions.
 *
 * Position 10 is the exact top of the semicircle.
 * Tick marks appear at boundaries between sections (not at section centers).
 * The needle snaps to section centers.
 */
export default function Dial({ guess, target, revealed, interactive, onChange, leftLabel, rightLabel }) {
    const dialRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Map a position (0-20) to degrees. 0 → -90°, 10 → 0° (top), 20 → +90°.
    const valueToDeg = (v) => (v / MAX_VAL) * 180 - 90;

    // Map degrees (-90..+90) back to a position (0-20), snapped to nearest integer.
    const degToValue = (deg) => {
        const raw = ((deg + 90) / 180) * MAX_VAL;
        return Math.max(0, Math.min(MAX_VAL, Math.round(raw)));
    };

    const getAngleFromEvent = (clientX, clientY) => {
        if (!dialRef.current) return 0;
        const rect = dialRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.bottom;

        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        let angleDeg = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
        return Math.max(-90, Math.min(90, angleDeg));
    };

    const handleStart = (e) => {
        if (!interactive) return;
        setIsDragging(true);
        handleMove(e);
    };

    const handleMove = (e) => {
        if (!interactive || (!isDragging && e.type !== 'mousedown' && e.type !== 'touchstart')) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const angle = getAngleFromEvent(clientX, clientY);
        onChange(degToValue(angle));
    };

    const handleEnd = () => setIsDragging(false);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging]);

    /** Render tick marks at BOUNDARIES between sections */
    const renderTicks = () => {
        const ticks = [];
        // 20 boundaries between 21 sections (at positions 0.5, 1.5, …, 19.5)
        for (let i = 0; i < MAX_VAL; i++) {
            const boundary = i + 0.5;
            const deg = valueToDeg(boundary);
            ticks.push(
                <div
                    key={i}
                    className="dial-tick-container"
                    style={{ transform: `rotate(${deg}deg)` }}
                >
                    <div className="dial-strip" />
                </div>
            );
        }
        return ticks;
    };

    /** Render the target gradient wedge (scoring zones around target) */
    const renderTargetGradient = () => {
        if (!revealed && (target === null || interactive)) return null;
        return (
            <div
                className="target-gradient-container"
                style={{ transform: `rotate(${valueToDeg(target)}deg)` }}
            >
                <div className="target-gradient-wedge" />
            </div>
        );
    };

    return (
        <div className="dial-wrapper">
            <div
                className="dial-container"
                ref={dialRef}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                style={{ cursor: interactive ? 'grab' : 'default' }}
            >
                <div className="dial-background">
                    {renderTargetGradient()}
                    <div className="dial-ticks-layer">
                        {renderTicks()}
                    </div>
                </div>

                {/* Needle — rotates from center-bottom of the semicircle */}
                <div
                    className="dial-needle"
                    style={{ transform: `rotate(${valueToDeg(guess)}deg)` }}
                />
                <div className="dial-hub" />
            </div>

            {/* Labels sit below the semicircle, outside the disc */}
            <div className="dial-labels">
                <span className="dial-label left">{leftLabel}</span>
                <span className="dial-label right">{rightLabel}</span>
            </div>
        </div>
    );
}
