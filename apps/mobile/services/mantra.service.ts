import { apiClient } from './api.config';

/**
 * CONFIGURATION
 * --------------
 * Set USE_MOCK_DATA = false later when backend is ready.
 */
const USE_MOCK_DATA = false;

/**
 * TYPES
 * -----
 * Matches your backend Mantra table structure.
 */
export interface Mantra {
  mantra_id: number;
  title: string;
  key_takeaway: string;
  background_author?: string;
  background_description?: string;
  jamie_take?: string;
  when_where?: string;
  negative_thoughts?: string;
  cbt_principles?: string;
  references?: string;
  created_at: string;
  is_active: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface MantraResponse {
  status: string;
  message?: string;
  data: Mantra[];
}

export interface CreateMantraPayload {
  title: string;
  key_takeaway: string;
  background_author?: string;
  background_description?: string;
  jamie_take?: string;
  when_where?: string;
  negative_thoughts?: string;
  cbt_principles?: string;
  references?: string;
  is_active?: boolean;
}

export interface MantraDetailResponse {
  status: string;
  message?: string;
  data: { mantra: Mantra };
}

export interface MantraMutationResponse {
  status: string;
  message?: string;
}

/**
 * MOCK DATA
 * ---------
 * Used while backend endpoints aren't connected.
 */
const INITIAL_MOCK_MANTRAS: Mantra[] = [
  {
    mantra_id: 1,
    title: 'Pressure Is a Privilege',
    key_takeaway:
      'When you\'re spiralling or feeling tense, say it to yourself "Pressure is a privilege" and then smile to remind yourself to enjoy the fact that you got the opportunity.',
    background_author: 'Billie Jean King',
    background_description:
      "Pressure means you're in a meaningful, high-stakes moment. It's proof that you've earned the opportunity to strive for excellence.\n\nPressure is not a negative burden but a positive sign that you are in a situation where your actions matter and you are trusted to make a difference.",
    jamie_take:
      "At face value, pressure sucks! Your hands shake, your heart races, your mind fogs. You think: \"I hate this, I just want it to be over.\"\n\nBut if you take a step back and dissect the feeling, you realize pressure is also proof that you're in a moment that matters… a chance to achieve something you value.\n\nFrom that perspective, the mindset shifts to:\n• \"Wow, I'm lucky to be here. Win or lose, success or failure, how many times will I get this chance?\n• How many people are handed the basketball in the dying seconds of the game to take the last shot?\n• Lucky me!\"\n\nThat mindset shifts you away from obsessing about success or failure and into the present moment… the only place you can actually perform. It steadies your nerves, sharpens your focus, and gives you the best chance of delivering.\n\nThat's why the last thing every player sees before walking onto the US Open's biggest court are those words: Pressure is a Privilege.\n\nAnd while most of us will never get the opportunity to play under the stadium lights, we do earn our own big moments: giving a presentation at work, serving to stay in the match at a local tennis tournament, stepping onto stage at a community talent show.\n\nThese moments… you created them. You signed up. You practiced. You faced your fears and managed to show up. The pressure you feel is a sign you created this opportunity.\n\nSo embrace it. Pressure means you're living, growing, and daring to challenge yourself. It means you're in the game.",
    when_where:
      '• Work & Career: presentation, job interview or leading a team\n• Sports & Performance: serving in a tennis match, stepping on stage or running a race\n• Education & Learning: taking an exam, participating in a debate\n• Personal Milestones: wedding toast, sharing a story\n• Everyday moments that matter: standing up for your values, having a tough conversation',
    negative_thoughts:
      '"I can\'t handle this pressure."\n"I hate this. I just want it to be over."\n"I\'m not good enough for this."\n"If I mess up, it\'ll be a disaster."\n"Everyone is watching and judging me."\n"Why me? I wish someone else had to do this."',
    cbt_principles:
      'This mantra is a cognitive reframe that reduces anxiety, builds resilience, and helps you align with your values in the moment.\n\n• Cognitive Reframing (Reappraisal): Instead of interpreting pressure as a threat ("This is awful, I just want it over"), you reframe it as a privilege ("This means I\'ve earned a meaningful opportunity"). Effect: Reduces anxiety, increases motivation, and shifts focus toward growth.\n\n• Exposure and Tolerance of Discomfort: Avoiding uncomfortable situations reinforces fear. Facing them builds tolerance and confidence. By viewing pressure as valuable, you\'re less likely to avoid it. Each exposure helps you build resilience and perform better under stress.\n\n• Present-Moment Focus (Mindfulness within CBT): Anxiety often comes from focusing on what might go wrong or replaying past failures. Staying present reduces overwhelm. The mantra anchors you to the here and now.\n\n• Values-Based Action: Aligning actions with your values (what matters to you) gives meaning to discomfort. The stress you feel is directly tied to something you care about — performing well, achieving, showing up. Recognizing this turns pressure into a sign of alignment with your goals.\n\n• Growth Mindset and Self-Efficacy: Believing that challenges are opportunities for learning builds confidence and persistence. By treating pressure as proof of opportunity, you strengthen your sense of competence and readiness to grow.',
    references:
      'Reappraising Stress Arousal Improves Performance and Reduces Stress in Humans - Jamieson, M., et al. (2010)\n\nCognitive Behavioral Therapy for Adult Anxiety Disorders: A Meta-Analysis of Randomized Placebo-Controlled Trials\n\nEffects of Mindfulness on Psychological Health: A Review of Empirical Studies - Keng, S.L., et al. (2011)\n\nAcceptance and Commitment Therapy: Model, Processes, and Outcomes - Hayes, S.C., et al. (2006)\n\nMindsets: A View From Two Eras - Dweck, C.S.',
    created_at: new Date().toISOString(),
    is_active: true,
    isLiked: false,
    isSaved: false,
  },
  {
    mantra_id: 2,
    title: 'The Only Way Out Is Through',
    key_takeaway:
      'When facing difficult situations, remind yourself that avoiding the challenge only prolongs the pain. Embrace the difficulty and move forward through it.',
    background_author: 'Robert Frost',
    background_description:
      'From the poem "A Servant to Servants" - this phrase captures the idea that the only way to overcome a challenge is to face it head-on, not to avoid it.',
    jamie_take:
      "We all want to avoid pain. It's human nature. But avoidance doesn't make problems disappear—it just postpones them, often making them worse.\n\nThe truth is, most things we fear aren't as bad as we imagine. And even when they are difficult, moving through them builds strength and confidence.\n\nThink of it like walking through a storm. You can't go around it, you can't wait it out forever. The only way to get to the other side is to put one foot in front of the other and keep moving.\n\nEvery time you choose to face something hard instead of avoiding it, you prove to yourself that you're capable. You build resilience. You grow.\n\nThe way out is through.",
    when_where:
      "• Difficult conversations you've been avoiding\n• Grief and emotional pain\n• Challenging projects or tasks\n• Breaking bad habits\n• Facing fears and anxieties\n• Recovery from setbacks",
    negative_thoughts:
      '"I can\'t do this. It\'s too hard."\n"Maybe if I wait, the problem will go away."\n"I\'ll deal with this later."\n"There must be an easier way."\n"I\'m not strong enough to handle this."',
    cbt_principles:
      "• Behavioral Activation: Taking action even when you don't feel ready breaks the cycle of avoidance and builds momentum.\n\n• Exposure Therapy: Facing feared situations gradually reduces anxiety and builds confidence.\n\n• Problem-Solving: Engaging with challenges directly allows you to find solutions rather than dwelling on problems.\n\n• Acceptance: Acknowledging difficult emotions without trying to escape them reduces their power over you.",
    references:
      'Behavioral Activation for Depression - Martell, C.R., et al. (2001)\n\nExposure Therapy for Anxiety Disorders - Foa, E.B., & McLean, C.P. (2016)\n\nAcceptance and Commitment Therapy - Hayes, S.C., et al. (2006)',
    created_at: new Date().toISOString(),
    is_active: true,
    isLiked: false,
    isSaved: false,
  },
  {
    mantra_id: 3,
    title: 'What We Think, We Become',
    key_takeaway:
      'Your thoughts shape your reality. When negative thoughts arise, acknowledge them and consciously redirect to positive, empowering thoughts.',
    background_author: 'Buddha',
    background_description:
      'Ancient wisdom about the power of mindset. Our thoughts influence our emotions, behaviors, and ultimately our life experiences.',
    jamie_take:
      'Your mind is constantly telling you stories. "I\'m not good enough." "This will never work." "Everyone is judging me."\n\nBut here\'s the thing: these thoughts aren\'t facts. They\'re just thoughts. And you have the power to choose which ones you believe and act on.\n\nWhen you catch yourself in negative thinking patterns, pause. Acknowledge the thought without judgment, then ask: "Is this thought helping me or hurting me? Is it true? What would be a more helpful way to think about this?"\n\nOver time, this practice rewires your brain. You start to see possibilities instead of obstacles. You approach challenges with curiosity instead of dread.\n\nYour thoughts create your reality. Choose them wisely.',
    when_where:
      '• Before important events or performances\n• During self-doubt or negative self-talk\n• When facing setbacks or failures\n• Building new habits\n• Making difficult decisions\n• Starting new ventures',
    negative_thoughts:
      '"I always mess things up."\n"I\'m not smart/talented/worthy enough."\n"Nothing ever works out for me."\n"People don\'t like me."\n"I can\'t change."',
    cbt_principles:
      "• Cognitive Restructuring: Identifying and challenging negative automatic thoughts, replacing them with more balanced, realistic ones.\n\n• Metacognition: Becoming aware of your thinking patterns and recognizing that thoughts are not facts.\n\n• Self-Fulfilling Prophecy: Understanding how expectations influence outcomes - believing you'll fail makes failure more likely.\n\n• Neuroplasticity: The brain can form new neural pathways through repeated positive thinking patterns.",
    references:
      'Cognitive Therapy and the Emotional Disorders - Beck, A.T. (1976)\n\nThe Power of Positive Thinking - Peale, N.V. (1952)\n\nMindset: The New Psychology of Success - Dweck, C.S. (2006)\n\nNeuroplasticity and CBT - Doidge, N. (2007)',
    created_at: new Date().toISOString(),
    is_active: true,
    isLiked: false,
    isSaved: false,
  },
];

let mockMantras: Mantra[] = [...INITIAL_MOCK_MANTRAS];

/**
 * MOCK SERVICE
 * ------------
 * Simulates backend responses with delays and mock state.
 */
/* istanbul ignore next */
const mockUserState = {
  likedMantras: new Set<number>(),
  savedMantras: new Set<number>(),
};

/* istanbul ignore next */
const mockMantraService = {
  async getFeedMantras(_token: string): Promise<MantraResponse> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      status: 'success',
      data: mockMantras.map((m) => ({
        ...m,
        isLiked: mockUserState.likedMantras.has(m.mantra_id),
        isSaved: mockUserState.savedMantras.has(m.mantra_id),
      })),
    };
  },

  async likeMantra(mantraId: number, _token: string) {
    mockUserState.likedMantras.add(mantraId);
    return { status: 'success', message: 'Liked successfully' };
  },

  async unlikeMantra(mantraId: number, _token: string) {
    mockUserState.likedMantras.delete(mantraId);
    return { status: 'success', message: 'Unliked successfully' };
  },

  async saveMantra(mantraId: number, _token: string) {
    mockUserState.savedMantras.add(mantraId);
    return { status: 'success', message: 'Saved successfully' };
  },

  async unsaveMantra(mantraId: number, _token: string) {
    mockUserState.savedMantras.delete(mantraId);
    return { status: 'success', message: 'Removed from saved' };
  },
  async getSavedMantras(token: string) {
    const collectionId = 1;
    const response = await apiClient.get(`/collections/${collectionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.mantras;
  },

  async createMantra(
    mantraData: CreateMantraPayload,
    _token: string,
  ): Promise<MantraDetailResponse> {
    const nextId =
      mockMantras.length > 0 ? Math.max(...mockMantras.map((m) => m.mantra_id)) + 1 : 1;

    const newMantra: Mantra = {
      mantra_id: nextId,
      title: mantraData.title,
      key_takeaway: mantraData.key_takeaway,
      background_author: mantraData.background_author,
      background_description: mantraData.background_description,
      jamie_take: mantraData.jamie_take,
      when_where: mantraData.when_where,
      negative_thoughts: mantraData.negative_thoughts,
      cbt_principles: mantraData.cbt_principles,
      references: mantraData.references,
      created_at: new Date().toISOString(),
      is_active: mantraData.is_active ?? true,
      isLiked: false,
      isSaved: false,
    };

    mockMantras = [newMantra, ...mockMantras];

    return {
      status: 'success',
      data: { mantra: newMantra },
    };
  },
  async deleteMantra(mantraId: number, _token: string): Promise<MantraMutationResponse> {
    const exists = mockMantras.some((m) => m.mantra_id === mantraId);

    if (!exists) {
      return {
        status: 'error',
        message: 'Mantra not found',
      };
    }

    mockMantras = mockMantras.filter((m) => m.mantra_id !== mantraId);
    mockUserState.likedMantras.delete(mantraId);
    mockUserState.savedMantras.delete(mantraId);

    return {
      status: 'success',
      message: 'Mantra deleted successfully',
    };
  },

  async updateMantra(
    mantraId: number,
    updateData: any,
    _token: string,
  ): Promise<MantraDetailResponse> {
    const index = mockMantras.findIndex((m) => m.mantra_id === mantraId);
    if (index === -1) {
      return {
        status: 'error',
        message: 'Mantra not found',
        data: { mantra: null },
      } as any;
    }
    const updatedMantra = {
      ...mockMantras[index],
      ...updateData,
    };
    mockMantras[index] = updatedMantra;
    return {
      status: 'success',
      data: { mantra: updatedMantra },
    };
  },
};

/**
 * REAL API SERVICE
 * ----------------
 * To be used once backend endpoints exist.
 */
const realMantraService = {
  async getFeedMantras(token: string): Promise<MantraResponse> {
    const response = await apiClient.get<MantraResponse>('/mantras/feed', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async likeMantra(mantraId: number, token: string) {
    const response = await apiClient.post(
      `/mantras/like`,
      { mantra_id: mantraId },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  async unlikeMantra(mantraId: number, token: string) {
    const response = await apiClient.delete(`/mantras/like/${mantraId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async saveMantra(mantraId: number, token: string) {
    const response = await apiClient.post(
      `/mantras/${mantraId}/save`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  async unsaveMantra(mantraId: number, token: string) {
    const response = await apiClient.delete(`/mantras/${mantraId}/save/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async getSavedMantras(token: string): Promise<Mantra[]> {
    const response = await apiClient.get('/mantras/saved', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },
  async createMantra(
    mantraData: CreateMantraPayload,
    token: string,
  ): Promise<MantraDetailResponse> {
    const response = await apiClient.post<MantraDetailResponse>('/mantras', mantraData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  async deleteMantra(mantraId: number, token: string): Promise<MantraMutationResponse> {
    const response = await apiClient.delete<MantraMutationResponse>(`/mantras/${mantraId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  async updateMantra(
    mantraId: number,
    updateData: any,
    token: string,
  ): Promise<MantraDetailResponse> {
    const response = await apiClient.put<MantraDetailResponse>(`/mantras/${mantraId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

/**
 * EXPORT
 * ------
 * Automatically switches between mock and real backend.
 */
export const mantraService = USE_MOCK_DATA ? mockMantraService : realMantraService;
