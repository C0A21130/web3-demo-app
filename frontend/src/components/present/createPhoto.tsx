import { useState, useRef, useEffect } from 'react';
import { Flex, Group, Text, SegmentedControl, Button, FileButton } from '@mantine/core';

type Tool = 'pen' | 'circle';
type Color = 'black' | 'red' | 'green' | 'blue';
interface Stroke {
  tool: Tool;
  color: Color;
  points?: { x: number; y: number }[]; // for pen
  x?: number; // for circle
  y?: number; // for circle
}
interface displayPhotoProps {
  hidden: boolean;
  setPhoto: React.Dispatch<React.SetStateAction<File | null>>;
  photo: File | null;
  setPresentStatus: React.Dispatch<React.SetStateAction<"画像作成中" | "感謝を送信する" | "感謝を送信中" | "感謝を送信失敗" | "感謝を送信完了" >>;
}

const CreatePhoto = (props: displayPhotoProps) => {
  const [expression, setExpression] = useState<"イラスト" | "フォト">("イラスト");
  const { hidden, setPhoto, photo, setPresentStatus } = props;

  // ドローイング状態
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<Color>('black');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // キャンバスを画像ファイルに変換する関数
  const savePhoto = () => {
    // フォトが選択されている場合はそのまま保存
    if (expression !== "イラスト") {
      setPhoto(photo);
      return;
    }

    // キャンバス要素を取得
    const canvas = canvasRef.current;
    if (!canvas) return;

    // キャンバスをBlobに変換
    canvas.toBlob((blob) => {
      if (blob) {
        // BlobからFileオブジェクトを作成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `drawing-${timestamp}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        // Photoステートに保存
        setPhoto(file);
      }
    }, 'image/png', 1.0); // PNG形式、最高品質で保存
  };

  // ドローイングのロジック
  function handleMouseDown(e: React.MouseEvent) {
    setIsDrawing(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (tool === 'circle') {
      setStrokes([...strokes, { tool: 'circle', x, y, color }]);
      setIsDrawing(false);
    } else {
      setStrokes([...strokes, { tool: 'pen', color, points: [{ x, y }] }]);
    }
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (!isDrawing || tool === 'circle') return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStrokes((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last && last.tool === 'pen' && last.points) last.points.push({ x, y });
      return copy;
    });
  }
  function handleMouseUp() {
    setIsDrawing(false);
  }

  // 描画
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ユーザーの描画
    strokes.forEach((stroke) => {
      if (stroke.tool === 'circle' && stroke.x !== undefined && stroke.y !== undefined) {
        ctx.beginPath();
        ctx.arc(stroke.x, stroke.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      }
      if (stroke.tool === 'pen') {
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = 3;
        stroke.points?.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }
    });
  }

  // 描画更新
  useEffect(draw, [strokes]);

  return (
    <Flex direction="column" className="mt-4 w-full" hidden={hidden}>
      <Text>感謝の伝え方</Text>
      <SegmentedControl
        fullWidth
        data={["イラスト", "フォト"]}
        value={expression}
        onChange={() => setExpression(expression === "イラスト" ? "フォト" : "イラスト")}
      />

      {/* イラスト描画エリア */}
      <Group hidden={expression !== "イラスト"}>
        <div className="bg-white">

          <div className="py-2">
            <div className="font-semibold text-sm mb-2">感謝の気持ちを絵で表してください</div>

            {/* ツール選択 */}
            <Flex className="mb-2" direction="column" gap="xs">
              <Group>
                <Text className="mr-2">ツール:</Text>
                <Button variant={tool === 'pen' ? "filled" : "default"} size="xs" onClick={() => setTool('pen')}>ペン</Button>
                <Button variant={tool === 'circle' ? "filled" : "default"} size="xs" onClick={() => setTool('circle')}>円</Button>
              </Group>
              <Group>
                <Text className="mr-2">色:</Text>
                <Button variant={color === 'black' ? "filled" : "default"} size="xs" color='black' onClick={() => setColor('black')}>黒</Button>
                <Button variant={color === 'red' ? "filled" : "default"} size="xs" color='red' onClick={() => setColor('red')}>赤</Button>
                <Button variant={color === 'green' ? "filled" : "default"} size="xs" color='green' onClick={() => setColor('green')}>緑</Button>
                <Button variant={color === 'blue' ? "filled" : "default"} size="xs" color='blue' onClick={() => setColor('blue')}>青</Button>
              </Group>
              <Group>
                <Text className="mr-2">アクション:</Text>
                <Button variant="default" size="xs" onClick={() => setStrokes(strokes.slice(0, -1))}>元に戻す</Button>
                <Button variant="default" size="xs" onClick={() => setStrokes([])}>すべてクリア</Button>
              </Group>
            </Flex>

            {/* キャンバス */}
            <div className="border bg-white" style={{ width: 360, height: 320 }}>
              <canvas
                ref={canvasRef}
                width={360}
                height={320}
                className="w-full h-full"
                style={{ touchAction: 'none' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>
        </div>
      </Group>

      {/* 写真アップロードエリア */}
      <Group hidden={expression !== "フォト"} className="mt-4">
        <FileButton onChange={(file) => setPhoto(file)} accept="image/*">
          {(props) => <Button {...props}>写真を選択</Button>}
        </FileButton>
        {photo && <Text size="sm" className="break-words">{photo.name}</Text>}
      </Group>

      {/* 保存された画像の確認 */}
      {photo && (
        <div className="mt-3 p-2 bg-gray-50 rounded">
          <Text size="xs" color="dimmed">サイズ: {(photo.size / 1024).toFixed(1)}KB</Text>
        </div>
      )}

      <Button variant="light" color="blue" fullWidth className="mt-4" onClick={() => {savePhoto(); setPresentStatus("感謝を送信する")}}>
        送信相手を選択する
      </Button>
    </Flex>
  );
}

export default CreatePhoto;
