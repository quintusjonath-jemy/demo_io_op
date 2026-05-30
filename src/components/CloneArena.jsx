const CloneArena = ({
  fighters,
  fighterRefs,
  hoveredFighterId,
  realFighterId,
  pointerPosition,
  lockedSelection,
  gameMessage,
  streamRef,
  startNextRound,
}) => {
  return (
    <div className="arena-section">
      <h2 className="game-message">{gameMessage}</h2>

      <div className="clone-arena">
        {fighters.map((fighter) => (
          <div
            key={fighter.id}
            ref={(el) => {
              fighterRefs.current[fighter.id] = el;
            }}
            className={`fighter-card ${
              hoveredFighterId === fighter.id ? "fighter-hovered" : ""
            } ${
              fighter.revealed && fighter.id === realFighterId
                ? "fighter-real"
                : ""
            } ${
              fighter.revealed &&
              fighter.id !== realFighterId &&
              fighter.id === hoveredFighterId
                ? "fighter-wrong"
                : ""
            }`}
            style={{
              left: fighter.left,
              top: fighter.top,
              transform: `rotate(${fighter.rotation}deg) scale(${fighter.scale})`,
            }}
          >
            <video
              autoPlay
              playsInline
              muted
              className="fighter-video"
              ref={(el) => {
                if (el && streamRef.current) {
                  if (el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                  }

                  el.onloadedmetadata = () => {
                    el.play().catch((error) => {
                      console.log("Clone video play error:", error);
                    });
                  };
                }
              }}
            />

            {fighter.revealed && fighter.id === realFighterId && (
              <div className="fighter-badge real-badge">REAL</div>
            )}

            {fighter.revealed &&
              fighter.id !== realFighterId &&
              fighter.id === hoveredFighterId && (
                <div className="fighter-badge clone-badge">CLONE</div>
              )}
          </div>
        ))}

        {pointerPosition && !lockedSelection && (
          <div
            className="finger-pointer"
            style={{
              left: `${pointerPosition.x}px`,
              top: `${pointerPosition.y}px`,
            }}
          />
        )}
      </div>

      <div className="arena-buttons">
        <button className="reveal-btn">
          Hold your index finger on one card for 3 seconds
        </button>

        <button className="next-round-btn" onClick={startNextRound}>
          Next Round
        </button>
      </div>
    </div>
  );
}

export default CloneArena;