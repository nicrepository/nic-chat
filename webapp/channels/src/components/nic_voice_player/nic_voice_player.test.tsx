import React from 'react';
import { render, screen } from '@testing-library/react';

// Importa o cliente da API para podermos interceptá-lo
import { Client4 } from 'mattermost-redux/client';

import NicVoicePlayer from './nic_voice_player';

// 1. O Mock da Infraestrutura (Bypass de Rede)
jest.mock('mattermost-redux/client', () => ({
    Client4: {
        getFileUrl: jest.fn().mockImplementation((id) => `https://nic-chat.local/api/v4/files/${id}`),
    },
}));

describe('components/nic_voice_player', () => {
    const baseProps = {
        fileId: 'test_audio_123',
    };

    beforeEach(() => {
        // Limpa o estado dos mocks antes de cada cenário
        jest.clearAllMocks();
    });

    test('deve renderizar o componente e gerar a rota de download segura', () => {
        render(<NicVoicePlayer {...baseProps} />);

        // Garante que o componente pediu a URL autenticada correta
        expect(Client4.getFileUrl).toHaveBeenCalledWith('test_audio_123');

        // Busca o botão pelo título que definimos na interface
        const downloadBtn = screen.getByTitle('Baixar Áudio');
        expect(downloadBtn).toBeInTheDocument();
        
        // Verifica se a string "?download=1" foi anexada corretamente para forçar o download
        expect(downloadBtn).toHaveAttribute('href', 'https://nic-chat.local/api/v4/files/test_audio_123?download=1');
    });

    test('deve converter a string do banco de dados e exibir o tempo exato', () => {
        // Simula o bug clássico que resolvemos: o banco de dados entregando uma string "6"
        render(<NicVoicePlayer {...baseProps} durationProp="6" />);

        // A matemática interna deve cravar o tempo total
        expect(screen.getByText('00:00 / 00:06')).toBeInTheDocument();
    });

    test('deve iniciar com 00:00 de duração caso o metadado falhe (fallback)', () => {
        // Renderiza sem passar a durationProp
        render(<NicVoicePlayer {...baseProps} />);

        expect(screen.getByText('00:00 / 00:00')).toBeInTheDocument();
    });
import React from 'react';
import { render, screen } from '@testing-library/react';

// Importa o cliente da API para podermos interceptá-lo
import { Client4 } from 'mattermost-redux/client';

import NicVoicePlayer from './nic_voice_player';

// 1. O Mock da Infraestrutura (Bypass de Rede)
jest.mock('mattermost-redux/client', () => ({
    Client4: {
        getFileUrl: jest.fn().mockImplementation((id) => `https://nic-chat.local/api/v4/files/${id}`),
    },
}));

describe('components/nic_voice_player', () => {
    const baseProps = {
        fileId: 'test_audio_123',
    };

    beforeEach(() => {
        // Limpa o estado dos mocks antes de cada cenário
        jest.clearAllMocks();
    });

    test('deve renderizar o componente e gerar a rota de download segura', () => {
        render(<NicVoicePlayer {...baseProps} />);

        // Garante que o componente pediu a URL autenticada correta
        expect(Client4.getFileUrl).toHaveBeenCalledWith('test_audio_123');

        // Busca o botão pelo título que definimos na interface
        const downloadBtn = screen.getByTitle('Baixar Áudio');
        expect(downloadBtn).toBeInTheDocument();
        
        // Verifica se a string "?download=1" foi anexada corretamente para forçar o download
        expect(downloadBtn).toHaveAttribute('href', 'https://nic-chat.local/api/v4/files/test_audio_123?download=1');
    });

    test('deve converter a string do banco de dados e exibir o tempo exato', () => {
        // Simula o bug clássico que resolvemos: o banco de dados entregando uma string "6"
        render(<NicVoicePlayer {...baseProps} durationProp="6" />);

        // A matemática interna deve cravar o tempo total
        expect(screen.getByText('00:00 / 00:06')).toBeInTheDocument();
    });

    test('deve iniciar com 00:00 de duração caso o metadado falhe (fallback)', () => {
        // Renderiza sem passar a durationProp
        render(<NicVoicePlayer {...baseProps} />);

        expect(screen.getByText('00:00 / 00:00')).toBeInTheDocument();
    });
});