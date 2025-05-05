import { useNavigate } from 'react-router-dom';
import { Container, Text, Paper, Group, Button, List } from '@mantine/core';
import { IconHome, IconGift, IconUser, IconBrandGit } from "@tabler/icons-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container size="sm" className="mt-10">
      <Paper shadow="sm" withBorder className='p-4'>
        <Group>
          <Text size="lg">SSDLAB Daapsとは</Text>
          <Text>
            SSDLAB Daapsは、ブロックチェーン技術やスマートコントラクトの理解を深めるための学習ツールとして設計されています。
            <br />
            このアプリケーションは、Ethereumブロックチェーン上で動作するNFT(Non-Fungible Token)を利用した感謝の送信を行うことができます。
            <br />
            ユーザーは、NFTを発行し、そのNFTを他のユーザーに転送することで感謝の意を表すことができます。
          </Text>
        </Group>
        <Group className='mt-2'>
          <List type='ordered'>
            <List.Item icon={<IconHome size={20} />} className='mt-4'>
              HOME: ホーム画面では、発行されたNFT(Non-Fungible Token)一覧を確認することができる。
              発行されたNFTのトークン名やオーナー、感謝を受け取ったユーザーの確認が可能である。
            </List.Item>
            <List.Item icon={<IconGift size={20} />} className='mt-4'>
              PRESENT: プレゼント画面では、NFTを利用した感謝の送信を行う。
              トークン名と送信先のアドレス(もしくはユーザー名)を指定して送信する。
              まずトークンを発行し、発行されたトークンを転送することで感謝の送信を行う。
            </List.Item>
            <List.Item icon={<IconUser size={20} />} className='mt-4'>
              USER: ユーザー画面では、ウォレットの作成やETHの受け取り、ユーザー名の登録することができる。
            </List.Item>
          </List>
        </Group>
        <Group className='mt-4'>
          <Button onClick={() => navigate("/")}>アプリを始める</Button>
          <Button onClick={() => navigate("/user")}>ウォレットを作成する</Button>
          <a href='https://github.com/C0A21130/web3-demo-app' className='flex items-center'>
            <IconBrandGit /> 
            <Text>GitHub | Web3 Demo App</Text>
          </a>
        </Group>
      </Paper>
    </Container>
  );
}
export default NotFound;
