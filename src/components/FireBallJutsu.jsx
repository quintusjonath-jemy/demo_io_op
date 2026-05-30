import React, { useEffect, useRef, useState } from "react";
import JutsuCard from "./JutsuCard";

const FireBallJutsu = () => {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [handSignReady, setHandSignReady] = useState(false);
  const [isBlowing, setIsBlowing] = useState(false);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [fireReleased, setFireReleased] = useState(false);
  const [message, setMessage] = useState("Make Fire Ball hand sign");
  const [soundLevel, setSoundLevel] = useState(0);

  const startMicDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      microphoneStreamRef.current = stream;

      const audioContext = new window.AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      detectBlow();
    } catch (error) {
      console.log("Microphone error:", error);
      setMessage("Microphone access failed");
    }
  };

  const detectBlow = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }

      const average = sum / dataArray.length;
      setSoundLevel(Math.floor(average));

      if (handSignReady && average > 40 && !fireReleased) {
        releaseFireBall();
      }

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    };

    checkVolume();
  };

  const activateHandSign = async () => {
    setHandSignReady(true);
    setFireReleased(false);
    setMessage("Blow to release fireball 🔥");
    await startMicDetection();
  };

  const releaseFireBall = () => {
    setIsBlowing(true);
    setFireReleased(true);
    setMessage("Fire Ball Jutsu Released! 🔥");
    setEnemyHealth((prev) => Math.max(prev - 25, 0));

    setTimeout(() => {
      setIsBlowing(false);
    }, 1500);
  };

  const resetRound = () => {
    setHandSignReady(false);
    setIsBlowing(false);
    setFireReleased(false);
    setMessage("Make Fire Ball hand sign");
    setSoundLevel(0);
    setEnemyHealth(100);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="fireball-container">
      <h1>Jutsu Release</h1>
      <p>Fire Ball Jutsu</p>

      <JutsuCard
        image="/fire-sign.png"
        title="Fire Ball Jutsu"
        active={handSignReady}
      />

      <div className={`jutsu-box ${handSignReady ? "active" : ""}`}>
        <h2>{message}</h2>
      </div>

      <div className="sound-meter">
        <h3>Mic Level: {soundLevel}</h3>
      </div>

      <div className="enemy-box">
        <h2>Enemy HP: {enemyHealth}</h2>
      </div>

      <div className="battle-area">
        <div className="player-side">🧍</div>

        {isBlowing && <div className="fireball-effect">🔥🔥🔥</div>}

        <div className="enemy-side">👹</div>
      </div>

      <div className="arena-buttons">
        {!handSignReady ? (
          <button className="next-round-btn" onClick={activateHandSign}>
            Test Fire Sign
          </button>
        ) : (
          <button className="next-round-btn" onClick={resetRound}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default FireBallJutsu;