'use client'

import { useEffect, useState } from "react"
import { Input } from "../components/Input"
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
// Rate-Limited Task Scheduler

// Problem

// You are building a task scheduler that processes incoming jobs while respecting rate limits and priorities.

// Each task has:
// id (string)
// priority (integer, higher = more important)
// createdAt (timestamp in milliseconds)
// duration (milliseconds to execute)

// Rules

// The system can execute only one task at a time
// Tasks are selected by:
// Highest priority first
// If priorities tie → earliest createdAt
// The system has a rate limit:
// At most N milliseconds of work per rolling 1-second window
// If executing a task would exceed the rate limit, it must be delayed until enough capacity is available.
// Time always moves forward (no parallel execution).

// Input

// tasks: array of task objects
// rateLimitMs: maximum allowed execution time per second (e.g. 700)
// startTime: scheduler start timestamp

// Example:

// {
//   "rateLimitMs": 700,
//   "startTime": 0,
//   "tasks": [
//     { "id": "A", "priority": 2, "createdAt": 0, "duration": 400 },
//     { "id": "B", "priority": 1, "createdAt": 100, "duration": 300 },
//     { "id": "C", "priority": 2, "createdAt": 200, "duration": 500 }
//   ]
// }

// Output

// Return an array of execution records:

// [
//   { "id": "A", "start": 0, "end": 400 },
//   { "id": "C", "start": 400, "end": 900 },
//   { "id": "B", "start": 1000, "end": 1300 }
// ]


// (Notice how B is delayed due to rate limiting.)

// Constraints

// Tasks may arrive after scheduling has started
// You may not split a task once it begins
// Tasks must eventually execute
// tasks.length can be up to 10,000

// Optional Extensions

// Support task cancellation
// Allow multiple workers
// Add task deadlines
// Visualize the timeline

type Task = {
    id: string;
    priority: number;
    duration: number;
    progress: number;
    createdAt: Timestamp;
}

export const RateLimiter = () => {
const [taskId, setTaskId] = useState<string>('')
const [priority, setPriority] = useState<number>(0)
const [duration, setDuration] = useState<number>(0)
const [taskQueue, setTaskQueue] = useState<Task[]>([])
const [taskInProgress, setTaskInProgress] = useState<Task>()
const [timer, setTimer] = useState<NodeJS.Timeout | undefined>()


useEffect(() => {
    let duration = 0
    if(!!timer) return
    let task: Task | undefined = taskQueue.shift()
    if(!task) return
    setTaskQueue([...taskQueue])
    setTaskInProgress(task)

    const interval = setInterval(() => {
        if(!task) return
        if(duration >= task.duration){
            setTaskInProgress(undefined)
            task = undefined
            clearInterval(interval)
            clearInterval(timer)
            setTimer(undefined)
            duration = 0
            return
        }
        task.progress += 1000
        setTaskInProgress({...task})
        duration += 1000
    }, 1000)
    setTimer(interval)
}, [taskQueue, taskInProgress])

const setValidatedNumber = (val: string, setter: (int: number) => void) => {
    const int = parseInt(val)
    if(int) {
        setter(int)
    }
}

const createTask = () => {
    if(!duration || !taskId) {
        console.log('Name and Duration are required!')
    }
    setTaskQueue(prev => [...prev, {id: taskId, priority, duration, progress: 0, createdAt: Date.now()}].sort((a,b) => a.priority - b.priority))
    setTaskId('')
    setPriority(0)
    setDuration(0)
}

const formatDate = (time: number) => {
    const date = new Date(time)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

return (
    <>
        <div>
            <span>Create Task</span>
            <Input title="Task Name" value={taskId} setValue={setTaskId} />
            <Input title="Priority" value={priority} setValue={(val) => setValidatedNumber(val, setPriority)} />
            <Input title="Duration (ms)" value={duration} setValue={(val) => setValidatedNumber(val, setDuration)} />
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => createTask()}>Queue Task</button>
        </div>
        <div className="mt-8">
            <div className="flex w-full">
                <span className="w-1/4">Name</span>
                <span className="w-1/4">Priority</span>
                <span className="w-1/4">Duration</span>
                <span className="w-1/4">Timestamp</span>
            </div>
            {taskInProgress && (
                <div className="relative w-full" key={taskInProgress.id}>
                    <div className="absolute bg-green-500 h-1 mt-5" style={{'width': (taskInProgress.progress / taskInProgress.duration)*100+'%'}}></div>
                    <div className="flex w-full">
                        <span className="w-1/4">{taskInProgress.id}</span>
                        <span className="w-1/4">{taskInProgress.priority}</span>
                        <span className="w-1/4">{taskInProgress.progress}/{taskInProgress.duration}</span>
                        <span className="w-1/4">{formatDate(taskInProgress.createdAt)}</span>
                    </div>
                </div>
            )}
            {taskQueue.map((task, index) => 
                <div className="flex w-full" key={task.id+index}>
                    <span className="w-1/4">{task.id}</span>
                    <span className="w-1/4">{task.priority}</span>
                    <span className="w-1/4">{task.duration}</span>
                    <span className="w-1/4">{formatDate(task.createdAt)}</span>
                </div>
            )}
        </div>
    </>
)
}