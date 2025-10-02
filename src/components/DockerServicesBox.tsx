import { useState, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { colors } from "../utils/colors";
import { SplitBorder } from "./Border";

export default function DockerServicesBox({ 
    activeService, 
    setActiveService 
}: { 
    activeService: string | null,
    setActiveService: (service: string) => void }) 
{
    const [services, setServices] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    async function getDockerServices() {
        try {
            const result = await Bun.$`docker ps --format "{{.Names}}"`.quiet();
            const lines = result.stdout.toString().trim().split("\n").filter(Boolean);
            setServices(lines);
            if (lines.length > 0) {
                setActiveService(lines[0]);
            }
            setSelectedIndex(0);
        } catch (error) {
        }
    }

    useEffect(() => {
        getDockerServices();
    }, []);

    useKeyboard((key) => {
        if (key.name === 'j' || key.name === 'down') {
            const index = Math.min(selectedIndex + 1, services.length - 1);
            setSelectedIndex(index);
            setActiveService(services[index]);
        }

         if (key.name === 'k' || key.name === 'up') {
            const index = Math.max(selectedIndex - 1, 0);
            setActiveService(services[index]);
            setSelectedIndex(index);
        }
    });

    return (
        <box
            {...SplitBorder}
            borderColor={colors.accent}
            flexDirection="column"
            width="50%"
        >
            <box
                flexGrow={1}
                backgroundColor={colors.backgroundPanel}
                paddingTop={1}
                paddingBottom={1}
                paddingLeft={2}
                paddingRight={2}
            >
                {services.map((item, index) => (
                    <text
                        key={index}
                        content={item}
                        style={{
                            fg: index === selectedIndex ? colors.primary : colors.text
                        }}
                    />
                ))}
            </box>
        </box>
    )
}
