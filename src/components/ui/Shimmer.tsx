import { RGBA } from "@opentui/core"
import { useTimeline } from "@opentui/react"
import { useState, useEffect } from "react"

export type ShimmerProps = {
    text: string
    color: RGBA
}

const DURATION = 2_500

export function Shimmer(props: ShimmerProps) {
    const timeline = useTimeline({
        duration: DURATION,
        loop: true,
    })
    const characters = props.text.split("")
    const color = props.color

    const [shimmerValues, setShimmerValues] = useState<number[]>(() => 
        characters.map(() => 0.4)
    )

    useEffect(() => {
        characters.forEach((_, i) => {
            const target = {
                shimmer: shimmerValues[i],
                setShimmer: (value: number) => {
                    setShimmerValues(prev => {
                        const newValues = [...prev]
                        newValues[i] = value
                        return newValues
                    })
                },
            }

            timeline!.add(
                target,
                {
                    shimmer: 1,
                    duration: DURATION / (props.text.length + 1),
                    ease: "linear",
                    alternate: true,
                    loop: 2,
                    onUpdate: () => {
                        target.setShimmer(target.shimmer)
                    },
                },
                (i * (DURATION / (props.text.length + 1))) / 2,
            )
        })
    }, [timeline, props.text.length])

    return (
        <text>
            {characters.map((ch, i) => {
                const shimmer = shimmerValues[i]
                const fg = RGBA.fromInts(color.r * 255, color.g * 255, color.b * 255, shimmer * 255)
                return <span key={i} style={{ fg }}>{ch}</span>
            })}
        </text>
    )
}

