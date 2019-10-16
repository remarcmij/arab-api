'use strict';

type ITask = () => Promise<void>;

export default class TaskQueue {
  private concurrency: number;
  private onCompletion: () => void;
  private running: number;
  private queue: ITask[];

  // tslint:disable-next-line: no-empty
  constructor(concurrency: number, onCompletion = () => {}) {
    this.concurrency = concurrency;
    this.onCompletion = onCompletion;
    this.running = 0;
    this.queue = [];
  }

  public pushTask(task: ITask) {
    this.queue.push(task);
    this.next();
  }

  private next() {
    if (this.running === 0 && this.queue.length === 0) {
      this.onCompletion();
      return;
    }
    while (this.running < this.concurrency && this.queue.length !== 0) {
      const task = this.queue.shift()!;
      task().then(() => {
        this.running--;
        this.next();
      });
      this.running++;
    }
  }
}
