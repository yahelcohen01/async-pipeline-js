# H1
async-pipeline

 

A TypeScript-friendly library for orchestrating complex asynchronous workflows with built-in retries, parallelism, and error handling. Perfect for managing async tasks like API calls, data processing, and more.

Key Features

	•	Sequential Task Execution: Define async tasks that run in order, with the ability to pass data between them.
	•	Parallel Execution: Run multiple tasks in parallel to optimize performance.
	•	Retries with Delays: Automatically retry failed tasks with configurable retry counts and delay intervals.
	•	Conditional Execution: Conditionally run tasks based on previous step results.
	•	Timeouts: Define timeouts for tasks, canceling them if they take too long.
	•	Error Handling: Handle task failures gracefully, with custom error handlers.
	•	TypeScript Support: Full TypeScript support with well-defined types for input/output between steps.

Installation

`npm install async-pipeline`

or with Yarn:

`yarn add async-pipeline`

Quick Start

The following example demonstrates a basic pipeline with sequential and parallel tasks, retries, and error handling:

import { Pipeline } from 'async-pipeline';

async function fetchData(): Promise<{ data: string }> {
  // Simulate data fetch
  return new Promise((resolve) => setTimeout(() => resolve({ data: 'fetchedData' }), 1000));
}

async function processData(input: { data: string }): Promise<{ processedData: string }> {
  // Simulate data processing
  return new Promise((resolve) => setTimeout(() => resolve({ processedData: input.data.toUpperCase() }), 1000));
}

async function saveData(input: { processedData: string }): Promise<void> {
  // Simulate data saving
  return new Promise((resolve) => setTimeout(() => {
    console.log('Data saved:', input.processedData);
    resolve();
  }, 500));
}

async function sendNotification(): Promise<void> {
  // Simulate notification sending
  return new Promise((resolve) => setTimeout(() => {
    console.log('Notification sent');
    resolve();
  }, 500));
}

// Create and execute the pipeline
(async () => {
  const pipeline = new Pipeline();

  await pipeline
    .step('fetchData', fetchData)
    .step('processData', processData, ['fetchData']) // Depends on fetchData
    .parallel([
      { taskName: 'saveData', taskFn: saveData, dependencies: ['processData'] },
      { taskName: 'sendNotification', taskFn: sendNotification }
    ])
    .execute();
})();

Core Concepts

1. Sequential Steps

Tasks can be executed sequentially, with the results of one task being passed to the next.

pipeline.step('fetchData', fetchData)
        .step('processData', processData, ['fetchData']);

In this example, processData depends on the output of fetchData. The pipeline automatically resolves dependencies and ensures tasks run in the correct order.

2. Parallel Execution

You can execute multiple tasks in parallel using the .parallel() method. These tasks will run simultaneously, improving performance.

pipeline.parallel([
  { taskName: 'saveData', taskFn: saveData, dependencies: ['processData'] },
  { taskName: 'sendNotification', taskFn: sendNotification }
]);

Both saveData and sendNotification will be executed in parallel after processData completes.

3. Retries and Delays

For each step, you can specify the number of retry attempts and a delay between retries in case the task fails.

pipeline.step('fetchData', fetchData, [], { retry: 3, delay: 1000 });

Here, the fetchData step will retry up to 3 times with a 1-second delay between attempts if it encounters an error.

4. Error Handling

You can handle errors gracefully by adding custom error-handling functions.

pipeline.step('fetchData', fetchData, [], {
  retry: 3,
  delay: 1000,
  onError: (error) => console.error('Error fetching data:', error)
});

If fetchData fails, the onError function will be called, allowing you to log or react to the failure.

5. Conditional Execution

You can conditionally run tasks based on the output of previous tasks.

pipeline.step('conditionalTask', someTask, ['fetchData'], {
  condition: (results) => results.fetchData.data === 'some condition'
});

In this case, conditionalTask will only execute if the result of fetchData satisfies the condition.

6. Timeouts

Set timeouts for tasks to prevent long-running operations from blocking the pipeline.

pipeline.step('longRunningTask', taskFn, [], { timeout: 5000 });

Here, longRunningTask will be canceled if it takes longer than 5 seconds.

API Documentation

Pipeline

The main class that orchestrates async tasks.

	•	step(taskName: string, taskFn: TaskFunction, dependencies?: string[], config?: StepConfig)
Define a new step in the pipeline.
	•	taskName: A unique name for the task.
	•	taskFn: An async function representing the task.
	•	dependencies: An array of task names that this step depends on.
	•	config: Optional configuration object.
	•	retry: Number of retry attempts (default: 1).
	•	delay: Delay between retries (default: 0).
	•	timeout: Maximum time (in ms) before the task is canceled.
	•	condition: Function that determines if the step should run.
	•	parallel(tasks: StepConfig[])
Define multiple tasks to run in parallel.
	•	execute(): Promise<Map<string, any>>
Execute the pipeline and return the results of each step.

TaskFunction<Input, Output>

A function that performs an async task. It receives input from previous steps and returns a promise that resolves to the task’s result.

type TaskFunction<Input, Output> = (input: Input) => Promise<Output>;

StepConfig

Configuration for each step in the pipeline.

interface StepConfig<Input, Output> {
  taskName: string;
  taskFn: TaskFunction<Input, Output>;
  dependencies?: string[];
  retry?: number;
  delay?: number;
  timeout?: number;
  condition?: (results: any) => boolean;
}

Advanced Usage

Custom Logger

You can add a custom logger for debugging or tracking task progress.

pipeline.useLogger(customLogger)
  .on('stepSuccess', (stepName, result) => {
    console.log(`${stepName} succeeded with result:`, result);
  });

Input/Output Mapping

You can transform the results between steps.

pipeline.step('transformData', transformFn, ['fetchData'], {
  mapInput: (results) => results.fetchData.data
});

In this example, the result of fetchData is passed to transformData after being transformed.

Contributions

Contributions are welcome! If you’d like to improve this package, feel free to fork the repository and open a pull request. Please follow the contribution guidelines.

License

This project is licensed under the MIT License - see the LICENSE file for details.

This README gives a comprehensive explanation of your package’s functionality, guiding users through installation, usage, and all the advanced features. It makes the library approachable for developers of varying skill levels, with practical examples for real-world use cases.