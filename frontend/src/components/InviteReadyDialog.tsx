import { Button, Flex, Typography } from '@maxhub/max-ui';
import type { AssistInvite } from '../api/client';
import { copyText, shareMaxContent } from '../platform/maxBridge';
import { useToast } from './ToastProvider';
import { AppDialog } from './AppDialog';
import { InlineAction } from './InlineAction';
import { useState } from 'react';

function expiryLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'ограниченное время' : `до ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
}

export function InviteReadyDialog({ invite, onClose }: { invite: AssistInvite; onClose: () => void }) {
  const toast = useToast();
  const [pending, setPending] = useState<'copy' | 'share' | null>(null);
  const copy = async () => {
    setPending('copy');
    try {
      await copyText(invite.deep_link);
      toast('Ссылка скопирована');
    } catch {
      toast('Не удалось скопировать ссылку', 'error');
    } finally {
      setPending(null);
    }
  };
  const share = async () => {
    setPending('share');
    try {
      const result = await shareMaxContent({ text: invite.share_text, link: invite.deep_link });
      toast(result === 'clipboard' ? 'Ссылка скопирована — вставьте её в MAX' : result === 'max-web' ? 'MAX открыт, ссылка скопирована — вставьте её в чат' : 'Окно отправки открыто — выберите получателя');
    } catch {
      toast('Не удалось открыть отправку', 'error');
    } finally {
      setPending(null);
    }
  };
  return <AppDialog title="Ссылка готова" onClose={onClose} labelledBy="invite-ready-title">
    <Typography.Text>Эта ссылка ещё не отправлена конкретному человеку. Получателя выбираете вы.</Typography.Text>
    <div className="invite-link" aria-label="Ссылка для приглашения">{invite.deep_link}</div>
    <Typography.Text className="muted-text">Ссылка действует {expiryLabel(invite.expires_at)} и откроет помощь только после вашего подтверждения.</Typography.Text>
    <Flex direction="column" gap={8}>
      <InlineAction title="Скопировать" description="Вставьте ссылку в любой чат" action="Копировать" loading={pending === 'copy'} disabled={pending !== null} onClick={() => void copy()} />
      <InlineAction title="Отправить через MAX" description="Откроется системный выбор получателя" action="Отправить" variant="secondary" loading={pending === 'share'} disabled={pending !== null} onClick={() => void share()} />
      <Button size="small" stretched variant="ghost" disabled={pending !== null} onClick={onClose}>Продолжить ожидание</Button>
    </Flex>
  </AppDialog>;
}
