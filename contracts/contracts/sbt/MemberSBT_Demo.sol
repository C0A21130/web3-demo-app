// ----------------------------------------------------------------
// ■ 概要とインポート
// ----------------------------------------------------------------
// このコントラクトは、譲渡不可能な会員証SBT（ソウルバウンドトークン）のデモ版です。
// 通常版(MemberSBT.sol)とは異なり、誰でも自分自身にSBTを発行できるように簡略化されています。
//
// 主な用途:
// - フロントエンド開発時のテスト
// - デモンストレーション
// - 開発環境での動作確認
//
// 本番環境では、権限管理機能を持つ MemberSBT.sol の使用を推奨します。
// ----------------------------------------------------------------
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC5192} from "./ERC5192.sol";

// ----------------------------------------------------------------
// ■ コントラクトの定義と状態変数
// ----------------------------------------------------------------
// `MemberSBT_Demo` コントラクトを定義します。
// 
// 継承しているコントラクト:
// - ERC5192: SBT（譲渡不可能トークン）の基本機能を提供
// - AccessControl: 権限管理機能（デモ版では最小限の使用）
//
// 状態変数:
// - _nextTokenId: 次に発行するSBTのIDを管理するカウンター（0から開始）
// - _userNames: SBTのID（tokenId）とユーザー名を紐付けるマッピング
//
// イベント:
// - SBTMinted: SBTが新しく発行されたことを外部に通知するためのイベント
//   引数: to（受信者アドレス）, tokenId（発行されたToken ID）, userName（ユーザー名）
// ----------------------------------------------------------------
contract MemberSBT_Demo is ERC5192, AccessControl {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _userNames;
    event SBTMinted(address indexed to, uint256 indexed tokenId, string userName);

    // ----------------------------------------------------------------
    // ■ コンストラクタ (初期化処理) - デモ版
    // ----------------------------------------------------------------
    // コントラクトがデプロイされる時に一度だけ実行されます。
    // 
    // ★ 通常版との違い:
    // - MINTER_ROLEの初期設定を削除しました
    // - 誰でも自分自身にSBTを発行できるため、初期ミント権限者の設定が不要です
    // 
    // パラメータ:
    // - _name: SBTの名前（例: "Member Soulbound Token Demo"）
    // - _symbol: SBTのシンボル（例: "MSBTD"）
    // - _isLocked: SBTをロック（譲渡不可）にするかどうか（通常はtrue）
    // - ownerAdmin: 管理者アドレス（将来的な拡張のために設定）
    // ----------------------------------------------------------------
    constructor(
        string memory _name,
        string memory _symbol,
        bool _isLocked,
        address ownerAdmin
    ) ERC5192(_name, _symbol, _isLocked) {
        // 管理者ロールは念のため設定しておきます
        // 将来的にコントラクトをアップグレードする際に役立ちます
        _grantRole(DEFAULT_ADMIN_ROLE, ownerAdmin);
    }

    // ----------------------------------------------------------------
    // ■ safeMint (SBT発行関数) - デモ版
    // ----------------------------------------------------------------
    // この関数は、呼び出したユーザー自身にSBTを発行します。
    // 
    // ★ 通常版(MemberSBT.sol)との重要な違い:
    // 1. `onlyRole(MINTER_ROLE)` 修飾子を削除
    //    → 誰でもこの関数を呼び出せます（権限チェックなし）
    // 2. セルフミントのみ許可
    //    → `to == msg.sender` のチェックにより、自分自身にのみ発行可能
    // 
    // パラメータ:
    // - to: SBTの受信者アドレス（必ず msg.sender と一致する必要があります）
    // - userName: SBTに紐付けるユーザー名
    // 
    // 戻り値:
    // - tokenId: 発行されたSBTのID（uint256）
    // 
    // 処理の流れ:
    // 1. `to == msg.sender` をチェック（他人への発行を防止）
    // 2. 現在のtokenIdを取得
    // 3. SBTをミント（発行）
    // 4. tokenIdをインクリメント
    // 5. ユーザー名を保存
    // 6. SBTMintedイベントを発行
    // 7. tokenIdを返す
    // 
    // エラー:
    // - "You can only mint an SBT for yourself.": 
    //   toパラメータがmsg.senderと一致しない場合に発生
    // ----------------------------------------------------------------
    function safeMint(
        address to,
        string memory userName
    ) external /* onlyRole(MINTER_ROLE) */ returns (uint256) {
        // セキュリティチェック: 自分自身にのみSBTを発行可能
        require(to == msg.sender, "MemberSBT_Demo: You can only mint an SBT for yourself.");

        // 現在のtokenIdを取得（0から開始）
        uint256 tokenId = _nextTokenId;
        
        // SBTをミント（内部的に所有権を設定）
        _safeMint(to, tokenId);
        
        // 次回用にtokenIdをインクリメント
        _nextTokenId++;
        
        // ユーザー名をマッピングに保存
        _userNames[tokenId] = userName;
        
        // イベントを発行（オフチェーンでの追跡・インデックス化に使用）
        emit SBTMinted(to, tokenId, userName);
        
        // 発行されたtokenIdを返す
        return tokenId;
    }
    
    // ----------------------------------------------------------------
    // ■ getUserName (データ取得関数)
    // ----------------------------------------------------------------
    // tokenIdを指定して、SBTに紐付けられたユーザー名を取得する関数です。
    // 
    // パラメータ:
    // - tokenId: 取得したいSBTのID
    // 
    // 戻り値:
    // - ユーザー名（string）
    // 
    // セキュリティチェック:
    // - `require(_exists(tokenId), ...)` で、指定されたtokenIdのSBTが
    //   実際に存在するかをチェックし、存在しない場合はエラーを返します
    // 
    // 使用例:
    // - フロントエンドでSBT保持者の情報を表示する際に使用
    // - オフチェーンでユーザー情報を取得する際に使用
    // ----------------------------------------------------------------
    function getUserName(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "MemberSBT: Query for nonexistent token");
        return _userNames[tokenId];
    }

    // ----------------------------------------------------------------
    // ■ getTotalSupply (総発行数取得関数)
    // ----------------------------------------------------------------
    // これまでに発行されたSBTの総数を取得する関数です。
    // 
    // 戻り値:
    // - 総発行数（uint256）
    // 
    // 注意点:
    // - この関数は _nextTokenId の値を返します
    // - _nextTokenId は0から始まるため、発行数とインデックスの関係は以下の通り:
    //   例: 3つのSBTが発行されている場合
    //       - Token ID: 0, 1, 2 が存在
    //       - _nextTokenId = 3 (次に発行されるID)
    //       - getTotalSupply() = 3
    // 
    // 使用例:
    // - フロントエンドで全SBT所持者の一覧を取得する際、ループ範囲を決定するために使用
    // - 統計情報やダッシュボードで総発行数を表示する際に使用
    // ----------------------------------------------------------------
    function getTotalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    // ----------------------------------------------------------------
    // ■ supportsInterface (インターフェースサポート確認)
    // ----------------------------------------------------------------
    // このコントラクトがERC165の規格に準拠していることを示すための関数です。
    // 
    // 役割:
    // - 外部から「このコントラクトはどのインターフェースをサポートしているか」を
    //   問い合わせることができます
    // - ERC5192（SBT）とAccessControl（権限管理）の両方のインターフェースを
    //   サポートしていることを正しく外部に伝えることができます
    // 
    // パラメータ:
    // - interfaceId: 確認したいインターフェースのID（bytes4）
    // 
    // 戻り値:
    // - サポートしていればtrue、サポートしていなければfalse
    // 
    // オーバーライドの理由:
    // - 継承した2つの親コントラクト（ERC5192とAccessControl）が
    //   それぞれsupportsInterface関数を持っているため、
    //   どちらの実装を使うかを明示的に指定する必要があります
    // ----------------------------------------------------------------
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC5192, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}