interface displayPhotoProps {
    hidden: boolean;
    setPhoto: React.Dispatch<React.SetStateAction<File | null>>;
    photo: File | null;
    setPresentStatus: React.Dispatch<React.SetStateAction<"画像作成中" | "感謝を送信する" | "感謝を送信中" | "感謝を送信失敗" | "感謝を送信完了">>;
}
declare const CreatePhoto: (props: displayPhotoProps) => import("react/jsx-runtime").JSX.Element;
export default CreatePhoto;
