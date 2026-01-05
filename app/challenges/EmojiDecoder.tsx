// Challenge: The Emoji Cipher Decoder

// Write a program that:
// Takes in a cipher key (emoji → letter mapping)
// Takes in an encoded message (a string of emojis)
// Outputs the decoded text

// Example

// Cipher Key
// {
//   "🐶": "h",
//   "🐱": "e",
//   "🦊": "l",
//   "🐻": "o",
//   "🐼": " "
// }
// Encoded Message
// 🐶🐱🦊🦊🐻🐼🐶🐱🐻

// Rules
// Emojis are always single characters
// If an emoji isn’t in the key, replace it with ?
// Preserve spaces if they exist in the mapping

// Requirements (Mid-Level)
// Use a dictionary / map
// Loop through the encoded message
// Build the decoded string character by character

// ⭐ Bonus Levels (Optional but Fun)
// Pick one or more:
// Reverse Mode – Encode a normal message into emojis
// Frequency Hint – Show the most common emoji in the message
// Random Cipher Generator – Auto-generate a new emoji cipher
// Error Handling – Detect missing mappings and warn the user
// GUI / Web Version – Buttons + text input

'use client'

import { useEffect, useState } from "react"

function randomEmoji() {
    const min = 0x1F300;
    const max = 0x1F9FF;
    const codePoint = Math.floor(Math.random() * (max - min)) + min;
    return String.fromCodePoint(codePoint);
  }
  
export default function EmojiDecoder() {
    const [key, setKey] = useState<{[key:string]: string}>({
        "🐶": "h",
        "🐱": "e",
        "🦊": "l",
        "🐻": "o",
        "🐼": " "
        }
    )
    const [code, setCode] = useState<string>("🐶🐱🦊🦊🐻🐼🐶🐱🐻")
    const [message, setMessage] = useState<string>('')

    useEffect(() => {
        let cipher: string = ''
        for(let char of code) {
            if(key[char]){
                cipher += key[char]
            } else {
                cipher += '?'
            }
        }
        setMessage(cipher)
    }, [key, code])

    const generateNewCipher = (message: string) => {
        const newKey: {[key:string]: string} = {}
        let newCode = ''
        for(let char of message){
            const keyRef = Object.keys(newKey).find(key => newKey[key] === char)
            if(keyRef){
                newCode += keyRef
            } else {
                const newEmoji = randomEmoji()
                newKey[newEmoji] = char
                newCode += newEmoji
            }
        }
        setKey(newKey)
        setCode(newCode)
    }

    return (
        <>
            <h1>Create your own Secret Code</h1>
            <div className="flex flex-col mb-5">
                <span>Cipher Key</span>
                <input type="text" value={JSON.stringify(key)} onChange={(val) => setKey(JSON.parse(val.currentTarget.value))} />
            </div>
            <div className="flex flex-col mb-5">
                <span>Code</span>
                <input type="text" value={code} onChange={(val) => setCode(val.currentTarget.value)} />
            </div>
            <div className="flex flex-col mb-5">
                <span>Secret Message</span>
                <span>{message}</span>
            </div>
            <div className="flex flex-col mb-5">
                <span>Generate a new Cipher</span>
                <input type="text" placeholder="Your message to be coded here..." onChange={(val) => generateNewCipher(val.currentTarget.value)} />
            </div>
        </>
    )
}


