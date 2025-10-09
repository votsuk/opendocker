import type { Container } from "../stores/containers";

export async function getDockerContainers(): Promise<Container[]> {
    try {
        const process = Bun.spawn(
            ["docker", "ps", "-a", "--format", "{{.Names}}"],
            {stdout: "pipe", stderr: "pipe"}
        );

        const output = await new Response(process.stdout).text();
        process.kill();

        const lines = output.split("\n").filter(Boolean);
        const objs = lines.map((container) => {
            return { name: container };
        });

        // Enrich with health status
        const enriched = await Promise.all(objs.map(async (container) => {
            const inspectProcess = Bun.spawn(
                ["docker", "inspect", container.name, "--format", "{{.State.Status}}:{{if .State.Health}}{{.State.Health.Status}}{{end}}"],
                {stdout: "pipe", stderr: "pipe"}
            );

            try {
                const output = await new Response(inspectProcess.stdout).text();
                inspectProcess.kill();
                
                const [status, healthOutput] = output.split(":");
                const health = healthOutput.trim() || "";
                return { ...container, status: status, health: health };
            } catch (error) {
                inspectProcess.kill();
                return { ...container, status: undefined, health: undefined };
            }
        }));

        return enriched;
    } catch (error) {
        console.error(error);
        return [];
    }
}
