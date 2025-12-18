/**
 * Event Loop Ordering Challenge
Goal:
Predict and then implement code that produces a very specific console output using only:
setTimeout
Promise.resolve().then(...)
synchronous console.log
No other control flow (no async/await, no intervals, no recursion).
The Challenge
Write JavaScript code that logs the following in this exact order:
 
A
C
E
B
D
F
 
Constraints:
at least one setTimeout
 
at least one Promise microtask (Promise.resolve().then(...))
 
at least two logs come from microtasks
 
at least two logs come from macrotasks
 
no chained .then() waterfalls or nested timeouts that force order — ordering emerges from the event loop
 
no async/await, intervals, or loops
 */

'use client'

export default function EventLoop() {

  console.log('A')
  setTimeout(() => console.log('B'), 0);
  console.log('C')
  setTimeout(() => console.log('D'), 0);
  Promise.resolve().then(() =>
    console.log('E')
  )
  Promise.resolve().then(() => 
    setTimeout(() => console.log('F'), 0)
  )

  return (
    <div>
      Event Loop Challenge! <br/>
      Console log output should be: <br/>
      A <br/>
      C <br/>
      E <br/>
      B <br/>
      D <br/>
      F <br/>
    </div>
  );
}
