
export class Docker {
    private socket: string | null = null;

    private async getSocket() {
        if (this.socket) return this.socket;

        try {
            const res = await Bun.$`docker context inspect --format '{{.Endpoints.docker.Host}}' | sed 's|unix://||'`.text();
            this.socket = res.trim() || "/var/run/docker.sock";
        } catch (error) {
            console.error('Failed to get docker socket:', error);
            this.socket = "/var/run/docker.sock";
        }
        
        return this.socket;
    }
    
    private async request(path: string) {
        try {
            const process = Bun.spawn([
                "curl", "-s", "--unix-socket", await this.getSocket(), 
                `http://localhost${path}`
            ], { stdout: "pipe", stderr: "pipe" });

            const output = await new Response(process.stdout).text();
            process.kill();
            
            return JSON.parse(output);
        } catch (error) {
            console.error('Docker socket request failed:', error);
        }
    }

    async getContainers() {
        return this.request("/v1.41/containers/json?all=true");
    }

    async watch(callback: (containers: any[]) => void, onError?: (error: Error) => void) {
        try {
            let containers = await this.getContainers();
            callback(containers);

            const process = Bun.spawn([
                "curl", "-s", "--no-buffer", "--unix-socket", await this.getSocket(),
                "http://localhost/v1.41/events"
            ], { stdout: "pipe", stderr: "pipe" });

            const reader = process.stdout.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const event = JSON.parse(line);
                            if (event.Type === "container") {
                                containers = await this.getContainers();
                                callback(containers);
                                onError?.(undefined);
                            }
                        } catch (parseError) {
                            console.error('Failed to parse event:', line, parseError);
                        }
                    }
                }
            }
            
        } catch (error) {
            onError?.(new Error("Docker socket request failed"));
        }
    }
}
