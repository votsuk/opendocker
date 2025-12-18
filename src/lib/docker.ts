import type { ContainerBareMin } from '@/stores/application';
import D from 'dockerode';

export class Docker {
    private d: D;
    private static instance: Docker | null = null;

    private constructor(socket: string) {
        this.d = new D({ socketPath: socket });
    }

    public static async getInstance() {
        if (!Docker.instance) {
            const socket = await this.getSocket();
            Docker.instance = new Docker(socket);
        }
        return Docker.instance;
    }

    public static async getSocket() {
        try {
            const res = await Bun.$`docker context inspect --format '{{.Endpoints.docker.Host}}' | sed 's|unix://||'`.text();
            return res.trim() || "/var/run/docker.sock";
        } catch (error) {
            console.error('Failed to get docker socket:', error);
            return"/var/run/docker.sock";
        }
    }


    public async streamContainers(): Promise<Array<ContainerBareMin>> {
        const containers = await this.d.listContainers({ all: true });

        return containers.map((container: D.ContainerInfo) => {
             return {
                id: container.Id,
                name: container.Names[0].replace('/', ''),
                state: container.State,
                status: container.Status,
            }
        });
    }

    public async getContainer(id: string) {
        return this.d.getContainer(id).inspect().then(i => i.Name);
    }
}
