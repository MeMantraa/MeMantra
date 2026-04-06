import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import AppText from '../UI/textWrapper';
import DeepDiveCard from './DeepDiveCard';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type DeepDiveReaderProps = {
  title: string;
  content: string;
  referencesOnly?: boolean;
  reserveRightSpace?: number;
  headerInsetLeft?: number;
  headerInsetTop?: number;
  onToggleFocus?: () => void;
  onScrollStateChange?: (isScrolling: boolean) => void;
};

type SectionData = {
  summary: string;
  explanation?: string;
  example?: string;
};

function splitParagraphs(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  const blocks = trimmed
    .split(/\n\s*\n/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (blocks.length > 1) return blocks;

  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 2) return [trimmed];

  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    chunks.push(sentences.slice(i, i + 2).join(' '));
  }

  return chunks;
}

function buildSections(content: string): SectionData {
  const paragraphs = splitParagraphs(content);
  const summary = paragraphs[0] ?? content;
  const explanationCandidate = paragraphs.slice(1, 3).join('\n\n').trim();
  const explanation =
    explanationCandidate && explanationCandidate !== summary ? explanationCandidate : undefined;

  const exampleCandidate =
    paragraphs
      .slice(1)
      .find((segment) =>
        /(e\.g\.|for example|when you|try this|next time|imagine|for instance)/i.test(segment),
      ) || (paragraphs.length > 2 ? paragraphs[paragraphs.length - 1] : undefined);

  const example =
    exampleCandidate && exampleCandidate !== summary && exampleCandidate !== explanation
      ? exampleCandidate
      : undefined;

  return {
    summary,
    explanation,
    example,
  };
}

function buildReferenceItems(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  const rows = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) =>
      line
        .split(';')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    );

  return rows.length > 0 ? rows : [trimmed];
}

export default function DeepDiveReader({
  title,
  content,
  referencesOnly = false,
  reserveRightSpace = 0,
  headerInsetLeft = 0,
  headerInsetTop = 0,
  onToggleFocus,
  onScrollStateChange,
}: Readonly<DeepDiveReaderProps>) {
  const { colors } = useTheme();
  const sections = useMemo(() => buildSections(content), [content]);
  const referenceItems = useMemo(() => buildReferenceItems(content), [content]);
  const isSmallDevice = SCREEN_HEIGHT < 760;

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: isSmallDevice ? 0 : 4,
          paddingHorizontal: 18,
          paddingRight: 18 + reserveRightSpace,
          paddingBottom: isSmallDevice ? 132 : 142,
        }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        onScrollBeginDrag={() => onScrollStateChange?.(true)}
        onMomentumScrollBegin={() => onScrollStateChange?.(true)}
        onScrollEndDrag={() => onScrollStateChange?.(false)}
        onMomentumScrollEnd={() => onScrollStateChange?.(false)}
      >
        <View style={{ marginBottom: 8, paddingLeft: headerInsetLeft, paddingTop: headerInsetTop }}>
          <AppText style={{ color: colors.text, opacity: 0.62, fontSize: 11, marginBottom: 2 }}>
            DEEP DIVE
          </AppText>
          <TouchableOpacity activeOpacity={0.8} onPress={onToggleFocus}>
            <AppText style={{ color: colors.secondary, fontSize: 28, lineHeight: 32 }}>
              {title}
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={{ width: '100%' }}>
          {referencesOnly ? (
            <DeepDiveCard
              label="References"
              accentColor={colors.secondary}
              textColor={colors.text}
              backgroundColor={colors.primaryDark + '22'}
              borderColor={colors.text + '26'}
              muted
            >
              <View style={{ width: '100%' }}>
                {referenceItems.map((ref, index) => (
                  <View
                    key={`${title}-ref-${index}`}
                    style={{ marginBottom: index === referenceItems.length - 1 ? 0 : 10 }}
                  >
                    <AppText
                      style={{
                        color: colors.secondary,
                        opacity: 0.9,
                        fontSize: 12,
                        marginBottom: 2,
                      }}
                    >
                      Source {index + 1}
                    </AppText>
                    <AppText
                      style={{ color: colors.text, opacity: 0.92, fontSize: 14, lineHeight: 23 }}
                    >
                      {ref}
                    </AppText>
                  </View>
                ))}
              </View>
            </DeepDiveCard>
          ) : (
            <>
              <DeepDiveCard
                accentColor={colors.secondary}
                textColor={colors.text}
                backgroundColor={colors.primaryDark + '2d'}
                borderColor={colors.text + '30'}
              >
                <View style={{ width: '100%' }}>
                  <AppText style={{ color: colors.text, fontSize: 16, lineHeight: 25 }}>
                    {sections.summary}
                  </AppText>
                </View>
              </DeepDiveCard>

              {sections.explanation ? (
                <DeepDiveCard
                  accentColor={colors.secondary}
                  textColor={colors.text}
                  backgroundColor={colors.primaryDark + '22'}
                  borderColor={colors.text + '26'}
                >
                  <View style={{ width: '100%' }}>
                    <AppText style={{ color: colors.text, fontSize: 15, lineHeight: 24 }}>
                      {sections.explanation}
                    </AppText>
                  </View>
                </DeepDiveCard>
              ) : null}

              {sections.example ? (
                <DeepDiveCard
                  accentColor={colors.secondary}
                  textColor={colors.text}
                  backgroundColor={colors.primaryDark + '22'}
                  borderColor={colors.text + '26'}
                  muted
                >
                  <View style={{ width: '100%' }}>
                    <AppText
                      style={{ color: colors.text, opacity: 0.92, fontSize: 14, lineHeight: 23 }}
                    >
                      {sections.example}
                    </AppText>
                  </View>
                </DeepDiveCard>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 18,
          right: 18 + reserveRightSpace,
          bottom: 0,
          height: 30,
        }}
      >
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 30,
            backgroundColor: colors.primary,
            opacity: 0.08,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 18,
            backgroundColor: colors.primary,
            opacity: 0.2,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 10,
            backgroundColor: colors.primary,
            opacity: 0.34,
          }}
        />
      </View>
    </View>
  );
}
