const CameraSection = ({ streamRef, canvasRef }) => {
  return (
    <div className="camera-wrapper">
      <video
        className="video"
        autoPlay
        playsInline
        muted
        ref={(el) => {
          if (el && streamRef.current) {
            if (el.srcObject !== streamRef.current) {
              el.srcObject = streamRef.current;
            }

            el.onloadedmetadata = () => {
              el.play().catch((error) => {
                console.log("Main video play error:", error);
              });
            };
          }
        }}
      />
      <canvas ref={canvasRef} className="canvas" />
    </div>
  );
}

export default CameraSection;