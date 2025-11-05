
export class Docker {
    private socket = "/var/run/docker.sock";
    
    private async request(path: string) {
        try {
            const process = Bun.spawn([
                "curl", "-s", "--unix-socket", this.socket, 
                `http://localhost${path}`
            ], { stdout: "pipe", stderr: "pipe" });

            const output = await new Response(process.stdout).text();
            process.kill();
            
            return JSON.parse(output);
        } catch (error) {
            console.error('Docker socket request failed:', error);
            throw error;
        }
    }

    async getContainers() {
        return this.request("/v1.41/containers/json?all=true");
    }

    async watch(callback: (containers: any[]) => void) {
        try {
            let containers = await this.getContainers();
            callback(containers);

            const process = Bun.spawn([
                "curl", "-s", "--no-buffer", "--unix-socket", this.socket,
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
                            }
                        } catch (parseError) {
                            console.error('Failed to parse event:', line, parseError);
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('Docker watch failed', error);
            throw error;
        }
    }
}
