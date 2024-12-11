type NetworkStatusCallback = (online: boolean) => void;

class NetworkStatusManager {
  private callbacks: NetworkStatusCallback[] = [];
  private isOnline: boolean;

  constructor() {
    this.isOnline = navigator.onLine;
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyCallbacks();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyCallbacks();
    });
  }

  public addCallback(callback: NetworkStatusCallback) {
    this.callbacks.push(callback);
  }

  public removeCallback(callback: NetworkStatusCallback) {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  private notifyCallbacks() {
    this.callbacks.forEach((callback) => callback(this.isOnline));
  }

  public isNetworkOnline(): boolean {
    return this.isOnline;
  }
}

export const networkStatus = new NetworkStatusManager();
