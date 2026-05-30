import React, { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import shadowCloneSign from "../assets/shadow-clone-sign.png";
import JutsuCard from "./JutsuCard";
import CameraSection from "./CameraSection";
import CloneArena from "./CloneArena";

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

const ShadowCloneJutsu = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const captureCooldownRef = useRef(false);
  const arenaActiveRef = useRef(false);
  const fighterRefs = useRef({});
  const selectionTimerRef = useRef(null);
  const selectedFighterRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState("");
  const [jutsuDetected, setJutsuDetected] = useState(false);
  const [detectedText, setDetectedText] = useState("Show both hands");

  const [arenaActive, setArenaActive] = useState(false);
  const [fighters, setFighters] = useState([]);
  const [realFighterId, setRealFighterId] = useState(null);
  const [gameMessage, setGameMessage] = useState("Perform Shadow Clone Jutsu");
  const [hoveredFighterId, setHoveredFighterId] = useState(null);
  const [lockedSelection, setLockedSelection] = useState(false);
  const [pointerPosition, setPointerPosition] = useState(null);

  useEffect(() => {
    arenaActiveRef.current = arenaActive;
  }, [arenaActive]);

  const isFingerExtended = (landmarks, tipIndex, pipIndex) => {
    return landmarks[tipIndex].y < landmarks[pipIndex].y;
  };

  const isFingerFolded = (landmarks, tipIndex, pipIndex) => {
    return landmarks[tipIndex].y > landmarks[pipIndex].y;
  };

  const getPalmCenter = (landmarks) => {
    const wrist = landmarks[0];
    const indexBase = landmarks[5];
    const pinkyBase = landmarks[17];

    return {
      x: (wrist.x + indexBase.x + pinkyBase.x) / 3,
      y: (wrist.y + indexBase.y + pinkyBase.y) / 3,
    };
  };

  const getDistance = (point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const isShadowCloneHand = (landmarks) => {
    const indexUp = isFingerExtended(landmarks, 8, 6);
    const middleUp = isFingerExtended(landmarks, 12, 10);
    const ringDown = isFingerFolded(landmarks, 16, 14);
    const pinkyDown = isFingerFolded(landmarks, 20, 18);

    return indexUp && middleUp && ringDown && pinkyDown;
  };

  const createCloneArena = () => {
    const totalFighters = 5;
    const realIndex = Math.floor(Math.random() * totalFighters);

    const positions = [
      { left: "8%", top: "12%" },
      { left: "38%", top: "8%" },
      { left: "68%", top: "16%" },
      { left: "18%", top: "54%" },
      { left: "56%", top: "50%" },
    ];

    const newFighters = Array.from({ length: totalFighters }, (_, index) => ({
      id: index + 1,
      isReal: index === realIndex,
      left: positions[index].left,
      top: positions[index].top,
      rotation: Math.floor(Math.random() * 17) - 8,
      scale: 0.9 + Math.random() * 0.2,
      revealed: false,
    }));

    setFighters(newFighters);
    setRealFighterId(newFighters[realIndex].id);
    setArenaActive(true);
    setGameMessage("Point with one index finger to find the real person");
    setHoveredFighterId(null);
    setLockedSelection(false);
    setPointerPosition(null);
    selectedFighterRef.current = null;
  };

  const detectShadowCloneJutsu = (landmarksList) => {
    if (arenaActiveRef.current) return;

    if (!landmarksList || landmarksList.length < 2) {
      setJutsuDetected(false);
      setDetectedText("Show both hands");
      return;
    }

    const hand1 = landmarksList[0];
    const hand2 = landmarksList[1];

    const hand1Valid = isShadowCloneHand(hand1);
    const hand2Valid = isShadowCloneHand(hand2);

    if (!hand1Valid || !hand2Valid) {
      setJutsuDetected(false);
      setDetectedText("Make index + middle fingers up");
      return;
    }

    const center1 = getPalmCenter(hand1);
    const center2 = getPalmCenter(hand2);
    const distance = getDistance(center1, center2);

    if (distance < 0.25) {
      setJutsuDetected(true);
      setDetectedText("Shadow Clone Jutsu Released! 🔥");

      if (!captureCooldownRef.current) {
        captureCooldownRef.current = true;
        createCloneArena();

        setTimeout(() => {
          captureCooldownRef.current = false;
        }, 2000);
      }
    } else {
      setJutsuDetected(false);
      setDetectedText("Move both hands closer");
    }
  };

  const revealAnswer = (fighterId) => {
    setLockedSelection(true);

    setFighters((prev) =>
      prev.map((fighter) => ({
        ...fighter,
        revealed: fighter.id === fighterId || fighter.id === realFighterId,
      }))
    );

    if (fighterId === realFighterId) {
      setGameMessage("✅ You found the real person!");
    } else {
      setGameMessage("❌ That was a clone!");
    }
  };

  const clearSelectionTimer = () => {
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = null;
    }
  };

  const detectPointerTarget = (landmarks) => {
    if (!arenaActiveRef.current || lockedSelection) return;

    const fingertip = landmarks[8];
    if (!fingertip) return;

    const arena = document.querySelector(".clone-arena");
    if (!arena) return;

    const arenaRect = arena.getBoundingClientRect();

    const mirroredX = 1 - fingertip.x;

    const pointerX = arenaRect.left + mirroredX * arenaRect.width;
    const pointerY = arenaRect.top + fingertip.y * arenaRect.height;

    setPointerPosition({
      x: mirroredX * arenaRect.width,
      y: fingertip.y * arenaRect.height,
    });

    let matchedFighterId = null;

    fighters.forEach((fighter) => {
      const element = fighterRefs.current[fighter.id];
      if (!element) return;

      const rect = element.getBoundingClientRect();

      const inside =
        pointerX >= rect.left &&
        pointerX <= rect.right &&
        pointerY >= rect.top &&
        pointerY <= rect.bottom;

      if (inside) {
        matchedFighterId = fighter.id;
      }
    });

    setHoveredFighterId(matchedFighterId);

    if (!matchedFighterId) {
      selectedFighterRef.current = null;
      clearSelectionTimer();
      return;
    }

    if (selectedFighterRef.current !== matchedFighterId) {
      selectedFighterRef.current = matchedFighterId;
      clearSelectionTimer();

      selectionTimerRef.current = setTimeout(() => {
        revealAnswer(matchedFighterId);
      }, 3000);
    }
  };

  const startNextRound = () => {
    setArenaActive(false);
    setFighters([]);
    setRealFighterId(null);
    setJutsuDetected(false);
    setDetectedText("Show both hands");
    setGameMessage("Perform Shadow Clone Jutsu");
    setHoveredFighterId(null);
    setLockedSelection(false);
    setPointerPosition(null);
    selectedFighterRef.current = null;
    clearSelectionTimer();
  };

  useEffect(() => {
    let isMounted = true;

    const setupHandLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handLandmarkerRef.current = handLandmarker;

      if (isMounted) {
        setModelReady(true);
      }
    };

    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            resolve();
          };
        });

        await videoRef.current.play();
      }

      if (isMounted) {
        setCameraOn(true);
      }
    };

    const drawLandmarks = (landmarksList) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      landmarksList.forEach((landmarks) => {
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 3;

        HAND_CONNECTIONS.forEach(([start, end]) => {
          const startPoint = landmarks[start];
          const endPoint = landmarks[end];

          ctx.beginPath();
          ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
          ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
          ctx.stroke();
        });

        ctx.fillStyle = "#ffcc00";

        landmarks.forEach((point, index) => {
          const x = point.x * canvas.width;
          const y = point.y * canvas.height;

          ctx.beginPath();
          ctx.arc(x, y, index === 8 ? 10 : 6, 0, 2 * Math.PI);
          ctx.fill();
        });
      });
    };

    const predictWebcam = async () => {
      const video = videoRef.current;
      const handLandmarker = handLandmarkerRef.current;

      if (!video || !handLandmarker) return;

      if (video.readyState >= 2) {
        const nowInMs = performance.now();

        if (video.currentTime !== lastVideoTimeRef.current) {
          const results = handLandmarker.detectForVideo(video, nowInMs);
          lastVideoTimeRef.current = video.currentTime;

          if (!arenaActiveRef.current) {
            if (results.landmarks) {
              drawLandmarks(results.landmarks);
              detectShadowCloneJutsu(results.landmarks);
            } else {
              setJutsuDetected(false);
              setDetectedText("Show both hands");
            }
          } else {
            if (results.landmarks && results.landmarks.length >= 1) {
              detectPointerTarget(results.landmarks[0]);
            } else {
              setHoveredFighterId(null);
              setPointerPosition(null);
              selectedFighterRef.current = null;
              clearSelectionTimer();
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    };

    const init = async () => {
      try {
        setError("");
        await setupHandLandmarker();
        await setupCamera();
        predictWebcam();
      } catch (err) {
        console.error(err);
        setError("Could not start hand tracking.");
      }
    };

    init();

    return () => {
      isMounted = false;
      clearSelectionTimer();

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, [fighters, realFighterId, lockedSelection]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden-video"
      />

      <h1>Jutsu Release</h1>
      <p>Shadow Clone Arena</p>

      {error && <p className="error">{error}</p>}

      {!arenaActive && (
        <>
          <CameraSection streamRef={streamRef} canvasRef={canvasRef} />

          <div className="status-box">
            <p>{cameraOn ? "Camera is running ✅" : "Starting camera..."}</p>
            <p>{modelReady ? "Hand model loaded ✅" : "Loading hand model..."}</p>
          </div>

          <JutsuCard
            image={shadowCloneSign}
            title="Shadow Clone Jutsu"
            active={jutsuDetected}
          />

          <div className={`jutsu-box ${jutsuDetected ? "active" : ""}`}>
            <h2>{detectedText}</h2>
          </div>
        </>
      )}

      {arenaActive && (
        <CloneArena
          fighters={fighters}
          fighterRefs={fighterRefs}
          hoveredFighterId={hoveredFighterId}
          realFighterId={realFighterId}
          pointerPosition={pointerPosition}
          lockedSelection={lockedSelection}
          gameMessage={gameMessage}
          streamRef={streamRef}
          startNextRound={startNextRound}
        />
      )}
    </>
  );
};

export default ShadowCloneJutsu;