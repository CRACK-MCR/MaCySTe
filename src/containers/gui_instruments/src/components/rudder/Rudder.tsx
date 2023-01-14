import { useCallback, useContext, useMemo, useRef, useState } from "react";
import RudderContext from "../../contexts/rudder/RudderContext";
import BorderedBox from "../UI/BorderedBox";
import DuoToneBar from "../UI/DuoToneBar/DuoToneBar";
import MetalLabel from "../UI/MetalLabel";

type IRudder = {
  maxRudderAngle: number;
  divisions: number;
};

const Rudder: React.FC<IRudder> = ({ maxRudderAngle, divisions }) => {
  // Draw calculations
  const circleCenter = { x: 50, y: 50 };
  const circleRadius = 20;
  const handleSizeDelta = 2;
  const tipSizeDelta = 6;
  const textDelta = 15;
  const arcDelta = 10;
  // Max draw angle
  const maxAngle = 75;
  const maxAngleRads = (maxAngle / 180) * Math.PI;
  // Angles of division
  const divisionAngles = useMemo(() => {
    const angles = [];
    const anglePerDivisionDeg = maxAngle / divisions;
    const anglePerDivisionRad = maxAngleRads / divisions;
    const rudderAnglePerDivisionDeg = maxRudderAngle / divisions;
    for (let i = 0; i < divisions; i++) {
      angles.push({
        degs: (i + 1) * anglePerDivisionDeg,
        rads: (i + 1) * anglePerDivisionRad,
        rudder: (i + 1) * rudderAnglePerDivisionDeg,
      });
    }
    return angles;
  }, [divisions, maxAngleRads, maxRudderAngle]);
  // State
  const rudderContext = useContext(RudderContext);
  const angle = useMemo(
    () => rudderContext.position * maxAngle,
    [rudderContext.position]
  );
  const anglePercentage = useMemo(() => (angle / maxAngle) * 100, [angle]);
  const [dragging, setDragging] = useState<boolean>(false);
  const circleRef = useRef<SVGCircleElement>(null);
  const handleRef = useRef<SVGPolygonElement>(null);
  // Event handlers
  const setAngleViaClick = useCallback(
    (angle: number) => {
      console.debug('Set angle via click', angle / maxAngle)
      rudderContext.setPosition(angle / maxAngle);
    },
    [rudderContext]
  );
  const startDrag = useCallback(
    (e: any) => {
      console.debug("Dragging started");
      setDragging(true);
    },
    [setDragging]
  );
  const stopDrag = useCallback(
    (e: any) => {
      console.debug("Dragging ended");
      setDragging(false);
    },
    [setDragging]
  );
  const handleDrag = useCallback(
    (e: any) => {
      // Check if still dragging
      if (e.buttons !== 1 && e.type === "mousemove") {
        // console.debug("Wrong buttons pressed", e);
        setDragging(false);
      }
      if (!dragging) {
        console.debug("Skipping event: not dragging");
        return;
      }
      // Grab elements
      const svgRootElement = e.target as SVGSVGElement;
      const circleElement = circleRef.current;
      const handleElement = handleRef.current;
      if (!(svgRootElement && circleElement && handleElement)) return;
      // Get transformation matrix
      const coordinateTransformMatrix = svgRootElement.getScreenCTM();
      if (!coordinateTransformMatrix) return;
      // Get circle center
      function fromSVGToScreen(x: number, y: number) {
        const result = coordinateTransformMatrix?.translate(x, y);
        return { x: result?.e, y: result?.f };
      }
      const circleCenterX = fromSVGToScreen(
        circleElement.cx.animVal.value,
        circleElement.cy.animVal.value
      ).x;
      const circleCenterY = fromSVGToScreen(
        circleElement.cx.animVal.value,
        circleElement.cy.animVal.value
      ).y;
      if (!(circleCenterX && circleCenterY)) return;
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      if (!(clientX && clientY)) {
        console.debug("No X or Y coordinate", e);
        return;
      }
      const offsetX = clientX - circleCenterX;
      const offsetY = clientY - circleCenterY;
      if (offsetY <= 0) return;
      // Calculate angle
      const angle = Math.PI / 2 - Math.atan2(offsetY, offsetX);
      const invertedAngle = -angle;
      const invertedAngleInDegrees = (invertedAngle / Math.PI) * 180;
      let finalAngleValue = invertedAngleInDegrees;
      if (invertedAngleInDegrees > maxAngle) finalAngleValue = maxAngle;
      else if (invertedAngleInDegrees < -maxAngle) finalAngleValue = -maxAngle;
      rudderContext.setPosition(finalAngleValue / maxAngle);
    },
    [dragging, setDragging, rudderContext]
  );
  // Draw
  return (
    <BorderedBox>
      <MetalLabel>Rudder</MetalLabel>
      <svg
        style={{
          userSelect: "none",
          touchAction: "none",
        }}
        viewBox="0 0 100 100"
        width="250"
        height="250"
        onMouseMove={handleDrag}
        onTouchMove={handleDrag}
      >
        <g textAnchor="middle" fontFamily="monospace">
          <text
            fontSize={8}
            x={circleCenter.x}
            y={circleCenter.y - circleRadius - textDelta}
            onClick={() => setAngleViaClick(0)}
          >
            0
          </text>
          <g fill="darkred">
            {divisionAngles.map((divisionAngle) => (
              <text
                fontSize={8}
                key={divisionAngle.degs}
                x={
                  circleCenter.x +
                  (circleRadius + textDelta) *
                    Math.cos(divisionAngle.rads + Math.PI / 2)
                }
                y={
                  circleCenter.y -
                  (circleRadius + textDelta) *
                    Math.sin(divisionAngle.rads + Math.PI / 2)
                }
                onClick={() => setAngleViaClick(-divisionAngle.degs)}
              >
                {divisionAngle.rudder.toFixed(0)}
              </text>
            ))}
          </g>
          <g fill="darkgreen">
            {divisionAngles.map((divisionAngle) => (
              <text
                fontSize={8}
                key={divisionAngle.degs}
                x={
                  circleCenter.x +
                  (circleRadius + textDelta) *
                    Math.cos(Math.PI / 2 - divisionAngle.rads)
                }
                y={
                  circleCenter.y -
                  (circleRadius + textDelta) *
                    Math.sin(Math.PI / 2 - divisionAngle.rads)
                }
                onClick={() => setAngleViaClick(divisionAngle.degs)}
              >
                {divisionAngle.rudder.toFixed(0)}
              </text>
            ))}
          </g>
        </g>
        <g strokeWidth="2">
          <path
            d={`
                M ${
                  circleCenter.x +
                  Math.cos(Math.PI / 2 + (Math.PI / 12) * 0.8) *
                    (circleRadius + arcDelta)
                } ${
              circleCenter.y -
              Math.sin(Math.PI / 2 - (Math.PI / 12) * 0.8) *
                (circleRadius + arcDelta)
            }
                A 30 30 0 0 1 ${
                  circleCenter.x +
                  Math.cos(Math.PI / 2 - (Math.PI / 12) * 0.8) *
                    (circleRadius + arcDelta)
                } ${
              circleCenter.y -
              Math.sin(Math.PI / 2 - (Math.PI / 12) * 0.8) *
                (circleRadius + arcDelta)
            }
                `}
            stroke="grey"
            fill="none"
          />
          <path
            d={`
                M ${
                  circleCenter.x +
                  Math.cos(Math.PI / 2 + maxAngleRads) *
                    (circleRadius + arcDelta)
                } ${
              circleCenter.y -
              Math.sin(Math.PI / 2 + maxAngleRads) * (circleRadius + arcDelta)
            }
                A 30 30 0 0 1 ${
                  circleCenter.x +
                  Math.cos(Math.PI / 2 + Math.PI / 12) *
                    (circleRadius + arcDelta)
                } ${
              circleCenter.y -
              Math.sin(Math.PI / 2 - Math.PI / 12) * (circleRadius + arcDelta)
            }
                `}
            stroke="darkred"
            fill="none"
          />
          <path
            d={`
                M ${
                  circleCenter.x +
                  Math.cos(Math.PI / 2 - Math.PI / 12) *
                    (circleRadius + arcDelta)
                } ${
              circleCenter.y -
              Math.sin(Math.PI / 2 - Math.PI / 12) * (circleRadius + arcDelta)
            }
                A 30 30 0 0 1 ${
                  circleCenter.x +
                  Math.cos(Math.PI / 2 - maxAngleRads) *
                    (circleRadius + arcDelta)
                } ${
              circleCenter.y -
              Math.sin(Math.PI / 2 - maxAngleRads) * (circleRadius + arcDelta)
            }
                `}
            stroke="darkgreen"
            fill="none"
          />
        </g>
        <g
          onTouchStart={startDrag}
          onTouchEnd={stopDrag}
          onMouseDown={startDrag}
          onMouseUp={stopDrag}
          transform={`rotate(${angle} ${circleCenter.x} ${circleCenter.y})`}
        >
          <circle
            ref={circleRef}
            cx={circleCenter.x}
            cy={circleCenter.y}
            r={circleRadius}
          />
          <polygon
            ref={handleRef}
            points={`
                                          ${circleCenter.x - handleSizeDelta},${
              circleCenter.y
            }
                                          ${circleCenter.x + handleSizeDelta},${
              circleCenter.y
            }
                                          ${
                                            circleCenter.x + handleSizeDelta * 2
                                          },${circleCenter.y + 45}
                                          ${
                                            circleCenter.x - handleSizeDelta * 2
                                          },${circleCenter.y + 45}
                                        `}
          />
          <polygon
            points={`
                          ${circleCenter.x},${
              circleCenter.y - circleRadius - tipSizeDelta
            }
                          ${circleCenter.x - tipSizeDelta * 2},${circleCenter.y}
                          ${circleCenter.x + tipSizeDelta * 2},${circleCenter.y}
                        `}
          />
          <text
            x={circleCenter.x}
            y={circleCenter.y + 3}
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="9"
            textLength={circleRadius * 2 * 0.90}
            fill="white"
          >
            MaCySTe
          </text>
        </g>
      </svg>
      <DuoToneBar percentage={anglePercentage} labels={["PORT", "STBD"]} />
    </BorderedBox>
  );
};

export default Rudder
