'use strict';

type ITask<T> = () => Promise<T>;

export default class TaskQueue<T> {
  private concurrency: number;
  private running: number;
  private queue: Array<ITask<T>>;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  public pushTask(task: ITask<T>) {
    this.queue.push(task);
    this.next();
  }

  private next() {
    while (this.running < this.concurrency && this.queue.length) {
      const task = this.queue.shift()!;
      task().then(() => {
        this.running--;
        this.next();
      });
      this.running++;
    }
  }
}
