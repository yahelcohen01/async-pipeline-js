type TaskFunction<Input, Output> = (input: Input) => Promise<Output>;

interface StepConfig<Input, Output> {
  taskName: string;
  taskFn: TaskFunction<Input, Output>;
  dependencies?: string[];
  retry?: number;
  delay?: number;
  timeout?: number;
  condition?: (results: any) => boolean;
}

export class Pipeline {
  private steps: Map<string, StepConfig<any, any>> = new Map();
  private results: Map<string, any> = new Map();

  step<Input, Output>(
    taskName: string,
    taskFn: TaskFunction<Input, Output>,
    dependencies: string[] = [],
    config: Partial<StepConfig<Input, Output>> = {}
  ): this {
    const stepConfig: StepConfig<Input, Output> = {
      taskName,
      taskFn,
      dependencies,
      retry: config.retry || 1,
      delay: config.delay || 0,
      timeout: config.timeout,
      condition: config.condition,
    };

    this.steps.set(taskName, stepConfig);
    return this;
  }

  parallel(tasks: StepConfig<any, any>[]): this {
    tasks.forEach((task) => this.steps.set(task.taskName, task));
    return this;
  }

  async execute(): Promise<Map<string, any>> {
    const executionQueue: string[] = Array.from(this.steps.keys());

    while (executionQueue.length > 0) {
      const taskName = executionQueue.shift();
      if (!taskName) continue;

      const stepConfig = this.steps.get(taskName);
      if (!stepConfig) throw new Error(`Step ${taskName} not found`);

      const dependenciesResults = stepConfig.dependencies
        ? this.getDependencyResults(stepConfig.dependencies)
        : {};

      if (stepConfig.condition && !stepConfig.condition(dependenciesResults)) {
        continue;
      }

      try {
        const result = await this.executeTaskWithRetry(
          stepConfig,
          dependenciesResults
        );
        this.results.set(taskName, result);
      } catch (error) {
        console.error(`Step ${taskName} failed:`, error);
        throw error;
      }
    }

    return this.results;
  }

  private async executeTaskWithRetry<Input, Output>(
    stepConfig: StepConfig<Input, Output>,
    input: Input
  ): Promise<Output> {
    const { taskFn, retry, delay } = stepConfig;

    for (let attempt = 1; attempt <= (retry || 1); attempt++) {
      try {
        const result = await taskFn(input);
        return result;
      } catch (error) {
        if (attempt < (retry || 1)) {
          console.warn(
            `Retrying step ${stepConfig.taskName} (Attempt ${attempt})`
          );
          await this.delay(delay || 1000);
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Failed after ${retry} attempts`);
  }

  private getDependencyResults(dependencies: string[]): any {
    const results: any = {};
    dependencies.forEach((dep) => {
      if (!this.results.has(dep)) {
        throw new Error(`Dependency ${dep} not resolved`);
      }
      results[dep] = this.results.get(dep);
    });
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
