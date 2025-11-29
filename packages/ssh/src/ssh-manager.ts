import { Client, ConnectConfig } from 'ssh2';
import { readFileSync } from 'fs';

export interface SSHConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class SSHManager {
  private client: Client | null = null;
  private config: SSHConfig;

  constructor(config: SSHConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client();

      const connectConfig: ConnectConfig = {
        host: this.config.host,
        port: this.config.port || 22,
        username: this.config.username,
      };

      // Add authentication method
      if (this.config.privateKeyPath) {
        try {
          const privateKey = readFileSync(this.config.privateKeyPath);
          connectConfig.privateKey = privateKey;
          if (this.config.passphrase) {
            connectConfig.passphrase = this.config.passphrase;
          }
        } catch (error) {
          reject(new Error(`Failed to read private key: ${error}`));
          return;
        }
      } else if (this.config.password) {
        connectConfig.password = this.config.password;
      } else {
        reject(new Error('Either password or privateKeyPath must be provided'));
        return;
      }

      this.client
        .on('ready', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        })
        .connect(connectConfig);
    });
  }

  async exec(command: string, timeout: number = 60000): Promise<ExecResult> {
    if (!this.client) {
      throw new Error('Not connected. Call connect() first.');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Command execution timed out after ${timeout}ms`));
      }, timeout);

      this.client!.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timeoutId);
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';
        let exitCode = 0;

        stream
          .on('close', (code: number) => {
            clearTimeout(timeoutId);
            exitCode = code;
            resolve({ stdout, stderr, exitCode });
          })
          .on('data', (data: Buffer) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
          });
      });
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}
