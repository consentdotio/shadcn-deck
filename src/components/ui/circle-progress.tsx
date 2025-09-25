'use client';

import {
	type HTMLAttributes,
	type ReactNode,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';
import { cn } from '~/lib/utils';

interface CircleProgressProps extends HTMLAttributes<HTMLDivElement> {
	value: number;
	maxValue: number;
	size?: number;
	strokeWidth?: number;
	showValue?: boolean;
	description?: ReactNode;
	suffix?: string;
	counterClockwise?: boolean;
	onColorChange?: (color: string) => void;
	onValueChange?: (value: number, percentage: number) => void;
	// Custom color function
	getColor?: (fillPercentage: number) => string;
	// Add className prop for styling
	className?: string;
	// Animation duration in ms
	animationDuration?: number;
	// Disable animation
	disableAnimation?: boolean;
	// Gradient support
	useGradient?: boolean;
	// Gradient colors array (from start to end)
	gradientColors?: string[];
	// Optional custom ID for the gradient
	gradientId?: string;
}

const CircleProgress = ({
	value,
	maxValue,
	size = 40,
	strokeWidth = 3,
	counterClockwise = false,
	onColorChange,
	onValueChange,
	// New custom color function
	getColor,
	className,
	// Animation duration with default of 300ms
	animationDuration = 300,
	// Option to disable animation
	disableAnimation = false,
	// Gradient options
	useGradient = false,
	gradientColors = ['#10b981', '#f59e0b', '#ef4444'],
	gradientId,
	...props
}: CircleProgressProps) => {
	// Use React useId for stable IDs across server/client
	const stableId = useId();

	// Keep track of previous value to prevent resets
	const prevValueRef = useRef(value);

	// Initialize with the current value to prevent starting from zero
	const [animatedValue, setAnimatedValue] = useState(value);

	// Use a ref to track the current animation value without causing re-renders
	const animatedValueRef = useRef(animatedValue);

	// Generate a unique gradient ID if not provided - using useId for stability
	const uniqueGradientId = useMemo(
		() => gradientId || `circle-progress-gradient-${stableId}`,
		[gradientId, stableId]
	);

	// Update ref when state changes
	useEffect(() => {
		animatedValueRef.current = animatedValue;
	}, [animatedValue]);

	// Calculate dimensions with some margin to prevent cutting off
	const svgSize = size + strokeWidth * 2;
	const radius = size / 2 - strokeWidth / 2;
	const center = svgSize / 2;
	const circumference = 2 * Math.PI * radius;
	const fillPercentage = Math.min(animatedValue / maxValue, 1);
	const strokeDashoffset = circumference * (1 - fillPercentage);

	// Default color function
	const defaultGetColor = (percentage: number) => {
		if (percentage < 0.7) {
			return 'stroke-emerald-500'; // Green
		}
		if (percentage < 0.9) {
			return 'stroke-amber-500'; // Yellow/Orange
		}
		return 'stroke-red-500'; // Red
	};

	// Use custom color function if provided, otherwise use default
	const currentColor = useGradient
		? '' // We don't use the color classes with gradient
		: getColor
			? getColor(fillPercentage)
			: defaultGetColor(fillPercentage);

	// Animation effect - improved to prevent resets
	useEffect(() => {
		// Skip animation on first render or if value hasn't changed
		if (value === prevValueRef.current) {
			return;
		}

		// If animation is disabled, just set the value directly
		if (disableAnimation) {
			setAnimatedValue(value);
			prevValueRef.current = value;
			return;
		}

		// Start animation from current value
		const start = animatedValueRef.current;
		const end = Math.min(value, maxValue);
		const startTime = performance.now();

		// Don't animate if the change is tiny
		if (Math.abs(end - start) < 0.01) {
			setAnimatedValue(end);
			prevValueRef.current = value;
			return;
		}

		const animateProgress = (timestamp: number) => {
			const elapsed = timestamp - startTime;
			const progress = Math.min(elapsed / animationDuration, 1);

			// Use easeOutQuad for smoother deceleration
			const easeProgress = 1 - (1 - progress) * (1 - progress);
			const currentValue = start + (end - start) * easeProgress;

			setAnimatedValue(currentValue);

			if (progress < 1) {
				requestAnimationFrame(animateProgress);
			} else {
				// Update the previous value after animation completes
				prevValueRef.current = value;
			}
		};

		const animationFrame = requestAnimationFrame(animateProgress);

		return () => cancelAnimationFrame(animationFrame);
	}, [value, maxValue, animationDuration, disableAnimation]);

	useEffect(() => {
		if (onColorChange) {
			onColorChange(currentColor);
		}
	}, [currentColor, onColorChange]);

	useEffect(() => {
		if (onValueChange) {
			onValueChange(animatedValue, fillPercentage);
		}
	}, [animatedValue, fillPercentage, onValueChange]);

	// Format value text for aria-valuetext - more descriptive for screen readers
	const valueText =
		props['aria-valuetext'] ||
		`${Math.round(value)}${props.suffix ? props.suffix : ''} out of ${maxValue}${props.suffix ? props.suffix : ''}, ${Math.round(fillPercentage * 100)}% complete`;

	return (
		// biome-ignore lint/a11y/useAriaPropsSupportedByRole: reccomended by shadcn
		<div
			className={cn('relative flex items-center justify-center', className)}
			aria-valuenow={value}
			aria-valuemin={0}
			aria-valuemax={maxValue}
			aria-valuetext={valueText}
			{...props}
		>
			<svg
				width={svgSize}
				height={svgSize}
				viewBox={`0 0 ${svgSize} ${svgSize}`}
				className={cn('duration-300')}
				style={{ overflow: 'visible' }}
			>
				<title>{props.title}</title>
				{/* SVG Gradient Definition */}
				{useGradient && (
					<defs>
						<linearGradient
							id={uniqueGradientId}
							gradientUnits="userSpaceOnUse"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="100%"
						>
							{gradientColors.map((color, index) => (
								<stop
									key={index}
									offset={`${(index / (gradientColors.length - 1)) * 100}%`}
									stopColor={color}
								/>
							))}
						</linearGradient>
					</defs>
				)}
				{/* Background track circle */}
				<circle
					cx={center}
					cy={center}
					r={radius}
					className="fill-transparent stroke-[#333333]"
					strokeWidth={strokeWidth}
				/>
				{/* Progress circle */}
				<circle
					cx={center}
					cy={center}
					r={radius}
					className={cn(
						'fill-transparent transition-colors',
						!useGradient && currentColor
					)}
					style={
						useGradient ? { stroke: `url(#${uniqueGradientId})` } : undefined
					}
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={
						counterClockwise ? -strokeDashoffset : strokeDashoffset
					}
					transform={`rotate(-90 ${center} ${center})`}
					strokeLinecap="round"
				/>
			</svg>
		</div>
	);
};

export { CircleProgress };
