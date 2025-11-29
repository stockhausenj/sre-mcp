import * as k8s from "@kubernetes/client-node";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class KubeManager {
  private kc: k8s.KubeConfig;
  private k8sApi: k8s.CoreV1Api;

  constructor() {
    this.kc = new k8s.KubeConfig();
    this.kc.loadFromDefault();
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
  }

  async getPods(namespace: string = "default") {
    try {
      const response = await this.k8sApi.listNamespacedPod(namespace);
      return response.body.items.map((pod) => ({
        name: pod.metadata?.name,
        namespace: pod.metadata?.namespace,
        status: pod.status?.phase,
        nodeName: pod.spec?.nodeName,
        podIP: pod.status?.podIP,
        containers: pod.spec?.containers.map((c) => ({
          name: c.name,
          image: c.image,
        })),
      }));
    } catch (error) {
      throw new Error(`Failed to get pods: ${error}`);
    }
  }

  async getNodes() {
    try {
      const response = await this.k8sApi.listNode();
      return response.body.items.map((node) => ({
        name: node.metadata?.name,
        status: node.status?.conditions?.find((c) => c.type === "Ready")?.status,
        version: node.status?.nodeInfo?.kubeletVersion,
        osImage: node.status?.nodeInfo?.osImage,
        architecture: node.status?.nodeInfo?.architecture,
        addresses: node.status?.addresses,
      }));
    } catch (error) {
      throw new Error(`Failed to get nodes: ${error}`);
    }
  }

  async executeKubectl(command: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`kubectl ${command}`);
      if (stderr && !stdout) {
        throw new Error(stderr);
      }
      return stdout || stderr;
    } catch (error) {
      throw new Error(`kubectl command failed: ${error}`);
    }
  }
}
