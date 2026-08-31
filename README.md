# Real-Time Video Calling Application (MeetSync)

## Abstract
MeetSync is a production-quality, browser-based real-time video calling application. It allows users to create disposable meeting rooms and share the link to instantly connect with another peer using high-definition video and audio. Built as a college project, it demonstrates the capabilities of WebRTC for peer-to-peer media streaming and the modern Next.js App Router.

## Technologies Used
* **Frontend:** React (Next.js 14 App Router), Tailwind CSS
* **Video/Audio:** WebRTC (`RTCPeerConnection`, `getUserMedia`, `getDisplayMedia`)
* **Signaling:** Pusher (Chosen to ensure 100% Vercel compatibility without needing a separate long-running WebSocket Node.js server)
* **Deployment:** Vercel

## Features
- **HD Video Calling**: Peer-to-peer video streaming.
- **Microphone & Camera Controls**: Toggle audio and video tracks on the fly.
- **Screen Sharing**: Replace video track with screen capture.
- **Real-Time Chat**: Send messages instantly to the other participant.
- **Participant Management**: See who is in the room.
- **No Account Required**: Instant joining via URL.
- **Responsive Design**: Works on Desktop, Tablet, and Mobile devices.

## System Architecture

```text
User A                       Signaling Server (Pusher)                     User B
  |                                     |                                     |
  | -------- 1. Join Presence Channel ->|                                     |
  |                                     |<-------- 2. Join Presence Channel - |
  |                                     |                                     |
  | <------- 3. User B Joined ----------|                                     |
  |                                     |                                     |
  | ---- 4. Send SDP Offer (via Pusher)->                                     |
  |                                     |--- 4. Deliver SDP Offer ----------> |
  |                                     |                                     |
  | <--- 5. Deliver SDP Answer ---------|                                     |
  |                                     |<-- 5. Send SDP Answer (via Pusher)- |
  |                                     |                                     |
  | ---- 6. Exchange ICE Candidates --->|<--- 6. Exchange ICE Candidates ---- |
  |                                     |                                     |
  =============================================================================
  |                           7. WebRTC P2P Connection                        |
  |                        (Audio / Video / Screen Share)                     |
  =============================================================================
```

The signaling server (Pusher) is strictly used for connection negotiation (SDP offers/answers) and network routing discovery (ICE candidates). Once the connection is established, all media (video and audio) is transmitted directly peer-to-peer via WebRTC.

## WebRTC Workflow
1. User joins the room and subscribes to the Pusher Presence channel.
2. If another user is already there, the newly joined user triggers a `client-user-joined` event.
3. The first user receives this event and creates an `RTCPeerConnection`.
4. The first user generates an SDP **Offer** and sends it via Pusher.
5. The second user receives the Offer, sets it as the remote description, generates an SDP **Answer**, and sends it back via Pusher.
6. Both users asynchronously exchange **ICE candidates** (discovered via STUN servers) to find the optimal network path.
7. The peer connection becomes `connected`, and audio/video tracks are exchanged.

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd video-call-app

# Install dependencies
npm install
```

## Environment Variables
Create a `.env.local` file in the root directory. You will need a free [Pusher](https://pusher.com) account.

> **Important**: In your Pusher dashboard, go to "App Settings" and enable **"Enable client events"**.

```env
# Pusher Credentials
PUSHER_APP_ID="your_app_id"
NEXT_PUBLIC_PUSHER_KEY="your_key"
PUSHER_SECRET="your_secret"
NEXT_PUBLIC_PUSHER_CLUSTER="your_cluster"
```

## Running Locally

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in two different browser windows to test the connection.

## Deployment on Vercel

1. Push your code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com) and click "Add New... > Project".
3. Import your GitHub repository.
4. In the "Environment Variables" section, add all 4 Pusher credentials from your `.env.local` file.
5. Click **Deploy**.

## Limitations
* **Peer-to-Peer constraints:** Since media is strictly P2P, this application is optimized for 1-on-1 calls. 
* **TURN Requirement:** Currently only public STUN servers are used. In highly restrictive corporate networks (symmetric NATs), a TURN server would be required to relay media.
* **No Permanent Chat History:** Chat messages are only kept in the browser's memory and are lost on refresh.

## Future Improvements
* Add a TURN server for better reliability on restrictive networks.
* Add WebRTC Data Channels for chat to eliminate reliance on Pusher for messaging.
* Add recording capabilities using the MediaRecorder API.
