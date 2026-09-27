import { Button, Spinner, Typography } from '@maxhub/max-ui';
import { useEffect, useRef, useState } from 'react';
import { useVoiceRoom, type VoiceRole } from '../realtime/useVoiceRoom';
import { useToast } from './ToastProvider';
import { AppIcon, LoadingMessage } from './UiPrimitives';

interface VoiceControlProps {
  sessionId: string;
  role: VoiceRole;
  autoConnect?: boolean;
}

export function VoiceControl({ sessionId, role, autoConnect = role === 'owner' }: VoiceControlProps) {
  const voice = useVoiceRoom({ sessionId, role, autoConnect });
  const previousRemote = useRef<string[]>([]);
  const [microphonePending, setMicrophonePending] = useState(false);
  const [soundPending, setSoundPending] = useState(false);
  const toast = useToast();
  const remote = voice.remoteParticipants;
  const speaking = remote.find((participant) => participant.speaking);
  const muted = remote.find((participant) => !participant.microphoneEnabled);
  const remoteCopy = remote.length === 0
    ? role === 'owner' ? 'Помощник ещё не подключился к разговору' : 'Владелец ещё не в разговоре'
    : speaking ? `${speaking.displayName} говорит`
      : remote.length > 1 ? `В разговоре: ${remote.length}`
        : muted ? `Микрофон ${muted.displayName} выключен`
          : `${remote[0].displayName} в разговоре`;
  const localCopy = !voice.localMic
    ? 'Ваш микрофон выключен'
    : remote.length > 0
      ? role === 'helper' ? `${remote[0].displayName} слышит вас` : `${remote[0].displayName} вас слышит`
      : '';

  const toggleMicrophone = async () => {
    setMicrophonePending(true);
    try { await voice.toggleMicrophone(); }
    finally { setMicrophonePending(false); }
  };
  const enableSound = async () => {
    setSoundPending(true);
    try { await voice.enableSound(); }
    finally { setSoundPending(false); }
  };

  useEffect(() => {
    const current = remote.map((participant) => participant.identity);
    const joined = remote.find((participant) => !previousRemote.current.includes(participant.identity));
    const left = previousRemote.current.find((identity) => !current.includes(identity));
    if (joined) toast(`${remote.find((participant) => participant.identity === joined.identity)?.displayName ?? joined.identity} теперь в разговоре`);
    else if (left) toast('Участник больше не в разговоре');
    previousRemote.current = current;
  }, [remote, toast]);

  return (
    <section className="voice-control" aria-label="Голосовой разговор">
      {role === 'helper' && voice.connection === 'idle' && <Button size="small" stretched variant="primary" onClick={() => void voice.connect()}>Начать разговор</Button>}
      {role === 'helper' && voice.connection === 'connecting' && <Button size="small" stretched variant="primary" loading disabled>Подключаем разговор…</Button>}
      {voice.connection === 'connecting' && role === 'owner' && <LoadingMessage>Подключаем звук…</LoadingMessage>}
      {voice.connection === 'idle' && role === 'owner' && autoConnect && <LoadingMessage>Подключаем звук…</LoadingMessage>}
      {voice.connection === 'reconnecting' && <LoadingMessage>Восстанавливаем голосовое соединение…</LoadingMessage>}
      {voice.connection === 'connected' && (
        <div className="voice-control__connected">
          <button type="button" className={`voice-mic${voice.localMic ? ' is-on' : ''}`} disabled={microphonePending} aria-label={voice.localMic ? 'Выключить микрофон' : 'Включить микрофон'} title={voice.localMic ? 'Выключить микрофон' : 'Включить микрофон'} onClick={() => void toggleMicrophone()}>{microphonePending ? <Spinner size={20} appearance="themed" /> : <AppIcon name="microphone" />}</button>
          <div className="voice-control__copy"><strong>{voice.localMic ? 'Микрофон включён' : 'Микрофон выключен'}</strong><span>{speaking ? remoteCopy : localCopy || remoteCopy}</span></div>
        </div>
      )}
      {voice.error && <Typography.Text className="notice--error">{voice.error}</Typography.Text>}
      {voice.connection === 'error' && <Button size="small" variant="secondary" onClick={() => void voice.connect()}>Повторить</Button>}
      {voice.connection === 'connected' && (voice.audioPlayback === 'blocked' || voice.audioPlayback === 'error') && (
        <div className="voice-control__playback">
          <Typography.Text>{voice.audioPlayback === 'blocked' ? 'Звук помощника готов' : 'Не удалось включить звук'}</Typography.Text>
          <Button size="small" variant="secondary" loading={soundPending} disabled={soundPending} onClick={() => void enableSound()}>Включить звук</Button>
        </div>
      )}
      <div ref={voice.audioContainerRef} className="voice-audio" aria-hidden="true" />
    </section>
  );
}
