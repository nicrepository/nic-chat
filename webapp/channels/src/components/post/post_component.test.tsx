// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import mergeObjects from 'packages/mattermost-redux/test/merge_objects';
import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import {getHistory} from 'utils/browser_history';
import {Locations} from 'utils/constants';
import {TestHelper} from 'utils/test_helper';

import type {GlobalState} from 'types/store';

import PostComponent from './post_component';
import type {Props} from './post_component';

jest.mock('components/nic_voice_player/nic_voice_player', () => () => <div data-testid='nic-voice-player-mock' />);

describe('PostComponent', () => {
    const currentTeam = TestHelper.getTeamMock();
    const channel = TestHelper.getChannelMock({team_id: currentTeam.id});

    const baseProps: Props = {
        center: false,
        currentTeam,
        currentUserId: 'currentUserId',
        displayName: '',
        hasReplies: false,
        isBot: false,
        isCollapsedThreadsEnabled: true,
        isFlagged: false,
        isMobileView: false,
        isPostAcknowledgementsEnabled: false,
        isPostPriorityEnabled: false,
        location: Locations.CENTER,
        post: TestHelper.getPostMock({channel_id: channel.id}),
        recentEmojis: [],
        replyCount: 0,
        team: currentTeam,
        pluginActions: [],
        actions: {
            markPostAsUnread: jest.fn(),
            emitShortcutReactToLastPostFrom: jest.fn(),
            setActionsMenuInitialisationState: jest.fn(),
            selectPost: jest.fn(),
            selectPostFromRightHandSideSearch: jest.fn(),
            removePost: jest.fn(),
            closeRightHandSide: jest.fn(),
            selectPostCard: jest.fn(),
            setRhsExpanded: jest.fn(),
        },
    };

    describe('reactions', () => {
        const baseState: DeepPartial<GlobalState> = {
            entities: {
                posts: {
                    reactions: {
                        [baseProps.post.id]: {
                            [`${baseProps.currentUserId}-taco`]: TestHelper.getReactionMock({emoji_name: 'taco'}),
                        },
                    },
                },
            },
        };

        test('should show reactions in the center channel', () => {
            renderWithContext(<PostComponent {...baseProps}/>, baseState);

            expect(screen.getByLabelText('reactions')).toBeInTheDocument();
        });

        test('should show reactions in thread view', () => {
            const state = mergeObjects(baseState, {
                views: {
                    rhs: {
                        selectedPostId: baseProps.post.id,
                    },
                },
            });

            let props: Props = {
                ...baseProps,
                location: Locations.RHS_ROOT,
            };
            const {rerender} = renderWithContext(<PostComponent {...props}/>, state);

            expect(screen.getByLabelText('reactions')).toBeInTheDocument();

            props = {
                ...baseProps,
                location: Locations.RHS_COMMENT,
            };
            rerender(<PostComponent {...props}/>);

            expect(screen.getByLabelText('reactions')).toBeInTheDocument();
        });

        test('should show only show reactions in search results with pinned/saved posts visible', () => {
            let props = {
                ...baseProps,
                location: Locations.SEARCH,
            };
            const {rerender} = renderWithContext(<PostComponent {...props}/>, baseState);

            expect(screen.queryByLabelText('reactions')).not.toBeInTheDocument();

            props = {
                ...baseProps,
                location: Locations.SEARCH,
                isPinnedPosts: true,
            };
            rerender(<PostComponent {...props}/>);

            expect(screen.getByLabelText('reactions')).toBeInTheDocument();

            props = {
                ...baseProps,
                location: Locations.SEARCH,
                isFlaggedPosts: true,
            };
            rerender(<PostComponent {...props}/>);

            expect(screen.getByLabelText('reactions')).toBeInTheDocument();
        });
    });

    describe('thread footer', () => {
        test('should never show thread footer for a post that isn\'t part of a thread', () => {
            let props: Props = baseProps;
            const {rerender} = renderWithContext(<PostComponent {...props}/>);

            expect(screen.queryByText(/Follow|Following/)).not.toBeInTheDocument();

            props = {
                ...baseProps,
                location: Locations.SEARCH,
            };
            rerender(<PostComponent {...props}/>);

            expect(screen.queryByText(/Follow|Following/)).not.toBeInTheDocument();
        });

        // This probably shouldn't appear in the search results https://mattermost.atlassian.net/browse/MM-53078
        test('should only show thread footer for a root post in the center channel and search results', () => {
            const rootPost = TestHelper.getPostMock({
                id: 'rootPost',
                channel_id: channel.id,
                reply_count: 1,
            });
            const state: DeepPartial<GlobalState> = {
                entities: {
                    posts: {
                        posts: {
                            rootPost,
                        },
                    },
                },
            };

            let props = {
                ...baseProps,
                hasReplies: true,
                post: rootPost,
                replyCount: 1,
            };
            const {rerender} = renderWithContext(<PostComponent {...props}/>, state);

            expect(screen.queryByText(/Follow|Following/)).toBeInTheDocument();

            props = {
                ...props,
                location: Locations.RHS_ROOT,
            };
            rerender(<PostComponent {...props}/>);

            expect(screen.queryByText(/Follow|Following/)).not.toBeInTheDocument();

            props = {
                ...props,
                location: Locations.SEARCH,
            };
            rerender(<PostComponent {...props}/>);

            expect(screen.queryByText(/Follow|Following/)).toBeInTheDocument();
        });

        test('should never show thread footer for a comment', () => {
            let props = {
                ...baseProps,
                hasReplies: true,
                post: {
                    ...baseProps.post,
                    root_id: 'some_other_post_id',
                },
            };
            const {rerender} = renderWithContext(<PostComponent {...props}/>);

            expect(screen.queryByText(/Follow|Following/)).not.toBeInTheDocument();

            props = {
                ...props,
                location: Locations.RHS_COMMENT,
            };
            rerender(<PostComponent {...props}/>);

            expect(screen.queryByText(/Follow|Following/)).not.toBeInTheDocument();

            props = {
                ...props,
                location: Locations.SEARCH,
            };
            rerender(<PostComponent {...props}/>);

            expect(screen.queryByText(/Follow|Following/)).not.toBeInTheDocument();
        });

        test('should not show thread footer with CRT disabled', () => {
            const rootPost = TestHelper.getPostMock({
                id: 'rootPost',
                channel_id: channel.id,
                reply_count: 1,
            });
            const state: DeepPartial<GlobalState> = {
                entities: {
                    posts: {
                        posts: {
                            rootPost,
                        },
                    },
                },
            };

            let props = {
                ...baseProps,
                hasReplies: true,
                isCollapsedThreadsEnabled: false,
                post: rootPost,
                replyCount: 1,
            };
            const {rerender} = renderWithContext(<PostComponent {...props}/>, state);

            expect(screen.queryByText(/Follow|Following/)).not.toBeInTheDocument();

            props = {
                ...props,
                location: Locations.SEARCH,
            };
            rerender(<PostComponent {...props}/>);

            expect(screen.queryByText(/Follow|Following/)).not.toBeInTheDocument();
        });

        describe('reply/X replies link', () => {
            const rootPost = TestHelper.getPostMock({
                id: 'rootPost',
                channel_id: channel.id,
                reply_count: 1,
            });
            const state: DeepPartial<GlobalState> = {
                entities: {
                    posts: {
                        posts: {
                            rootPost,
                        },
                    },
                },
            };

            const propsForRootPost = {
                ...baseProps,
                hasReplies: true,
                post: rootPost,
                replyCount: 1,
            };

            test('should select post in RHS when clicked in center channel', () => {
                renderWithContext(<PostComponent {...propsForRootPost}/>, state);

                userEvent.click(screen.getByText('1 reply'));

                // Yes, this action has a different name than the one you'd expect
                expect(propsForRootPost.actions.selectPostFromRightHandSideSearch).toHaveBeenCalledWith(rootPost);
            });

            test('should select post in RHS when clicked in center channel in a DM/GM', () => {
                const props = {
                    ...propsForRootPost,
                    team: undefined,
                };
                renderWithContext(<PostComponent {...props}/>, state);

                userEvent.click(screen.getByText('1 reply'));

                // Yes, this action has a different name than the one you'd expect
                expect(propsForRootPost.actions.selectPostFromRightHandSideSearch).toHaveBeenCalledWith(rootPost);
                expect(getHistory().push).not.toHaveBeenCalled();
            });

            test('should select post in RHS when clicked in a search result on the current team', () => {
                const props = {
                    ...propsForRootPost,
                    location: Locations.SEARCH,
                };
                renderWithContext(<PostComponent {...props}/>, state);

                userEvent.click(screen.getByText('1 reply'));

                expect(propsForRootPost.actions.selectPostFromRightHandSideSearch).toHaveBeenCalledWith(rootPost);
                expect(getHistory().push).not.toHaveBeenCalled();
            });

            test('should jump to post when clicked in a search result on another team', () => {
                const props = {
                    ...propsForRootPost,
                    location: Locations.SEARCH,
                    team: TestHelper.getTeamMock({id: 'another_team'}),
                };
                renderWithContext(<PostComponent {...props}/>, state);

                userEvent.click(screen.getByText('1 reply'));

                expect(propsForRootPost.actions.selectPostFromRightHandSideSearch).not.toHaveBeenCalled();
                expect(getHistory().push).toHaveBeenCalled();
            });
        });
    });
    // ==========================================================================
    // INJEÇÃO NIC-CHAT: Testes de Integração do Gravador de Voz
    // ==========================================================================
    describe('Nic-Chat: Interceptação de Mensagens de Voz', () => {
        test('deve renderizar o NicVoicePlayer quando o metadado nic_chat_type for voice_message', () => {
            // 1. Criamos um post falso simulando o payload gerado na Fase 2
            const audioPost = TestHelper.getPostMock({
                id: 'audio_post_123',
                channel_id: channel.id,
                file_ids: ['file_webm_123'],
                props: {
                    nic_chat_type: 'voice_message',
                    nic_voice_duration: 15
                }
            });

            const props = {
                ...baseProps,
                post: audioPost,
            };

            renderWithContext(<PostComponent {...props} />);

            // 2. Asserção principal: O nosso player DEVE estar na tela
            expect(screen.getByTestId('nic-voice-player-mock')).toBeInTheDocument();
        });

        test('não deve renderizar o NicVoicePlayer para arquivos comuns (ex: PDFs ou Imagens)', () => {
            // 1. Criamos um post de anexo comum, sem o metadado da Nic-Labs
            const normalFilePost = TestHelper.getPostMock({
                id: 'normal_post_456',
                channel_id: channel.id,
                file_ids: ['file_pdf_456'],
                props: {} // Sem a flag de segurança
            });

            const props = {
                ...baseProps,
                post: normalFilePost,
            };

            renderWithContext(<PostComponent {...props} />);

            // 2. Asserção principal: O nosso player NÃO pode aparecer
            expect(screen.queryByTestId('nic-voice-player-mock')).not.toBeInTheDocument();
        });
    });
});
