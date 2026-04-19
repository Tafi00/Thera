import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, ActivityIndicator, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Sparkles, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { usePainStore } from '@/stores/painStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import { getExercises, getUserBehavior } from '@/services/exercises';
import { getPainLogs } from '@/services/painLogs';
import { getExerciseRecommendations } from '@/services/groq';
import ExerciseCard from '@/components/ExerciseCard';
import { colors } from '@/utils/theme';
import type { Exercise } from '@/types';
import { mapPainAreasToCategories } from '@/utils/categoryMapper';

export default function RecommendationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { todayPainLog, painHistory } = usePainStore();
  const { setRecommendedExercises } = useExerciseStore();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Exercise[]>([]);
  const [insights, setInsights] = useState('');

  useEffect(() => {
    loadRecommendations();
  }, [user?.id, todayPainLog?.id]);

  const loadRecommendations = async () => {
    if (!user || !todayPainLog) {
      setRecommendations([]);
      setInsights('Bạn chưa nhập mức đau hôm nay. Vui lòng cập nhật mức đau để nhận gợi ý AI.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const painAreaKeys = todayPainLog?.pain_areas ? Object.keys(todayPainLog.pain_areas) : [];
      const mappedCategories = mapPainAreasToCategories(painAreaKeys);

      // Load all data needed for AI
      const [exercisesResult, behaviorResult, painLogsResult] = await Promise.all([
        getExercises(mappedCategories),
        getUserBehavior(user.id),
        getPainLogs(7),
      ]);

      if (!exercisesResult || !behaviorResult || !painLogsResult) {
        console.error('Failed to load data');
        return;
      }

      if (!todayPainLog) { setLoading(false); return; }      // Get AI recommendations
      const aiRecommendationsRaw = await getExerciseRecommendations({
        pain_areas: todayPainLog?.pain_areas ? Object.keys(todayPainLog.pain_areas) : [],
        behavior: ((behaviorResult as any).data || behaviorResult),
        recent_logs: ((painLogsResult as any).data || painLogsResult),
        available_exercises: ((exercisesResult as any).data || exercisesResult)
      });
      let aiRecommendations: any[] = [];
      try {
        let cleanJson = aiRecommendationsRaw;
        const match = aiRecommendationsRaw.match(/\[\s\S]*\]/);
        if (match) {
          cleanJson = match[0];
        } else {
          cleanJson = aiRecommendationsRaw.replace(/```json/gi, "").replace(/```/g, "").trim();
        }
        aiRecommendations = JSON.parse(cleanJson);
      } catch (e) {
        console.warn('Could not parse AI recommendations, using empty array', e);
      }

      // Map recommendations to exercises
      const recommendedExercises = aiRecommendations
        .map((rec: any) => ((exercisesResult as any).data || exercisesResult)!.find((ex: any) => ex.id === rec.exercise_id))
        .filter(Boolean) as Exercise[];

      setRecommendations(recommendedExercises);
      setRecommendedExercises(recommendedExercises);

      // Generate insights
      const avgPainLevel = ((painLogsResult as any).data || painLogsResult).reduce((sum: number, log: any) => sum + log.pain_level, 0) / ((painLogsResult as any).data || painLogsResult).length;
      const trend = todayPainLog.pain_level < avgPainLevel ? 'giảm' : 'tăng';
      setInsights(`Mức đau của bạn đã ${trend} so với tuần trước. Tiếp tục duy trì!`);
    } catch (error) {
      console.error('Load recommendations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = () => {
    if (recommendations.length > 0) {
      router.push({
        pathname: '/exercise-detail',
        params: { id: recommendations[0].id },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          AI đang phân tích và gợi ý bài tập phù hợp...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gợi ý bài tập</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Sparkles size={32} color={colors.primary} />
          <Text style={styles.title}>
            Chúng tôi tìm thấy {recommendations.length} bài tập phù hợp
          </Text>
          {insights && (
            <Text style={styles.insights}>{insights}</Text>
          )}
        </View>

        {/* Recommendations */}
        {recommendations.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                Không tìm thấy bài tập phù hợp. Vui lòng thử lại sau.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          recommendations.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseContainer}>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>#{index + 1}</Text>
              </View>
              <ExerciseCard
                exercise={exercise}
                onPress={() => router.push({
                  pathname: '/exercise-detail',
                  params: { id: exercise.id },
                })}
                recommended
              />
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      {recommendations.length > 0 && (
        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleStartWorkout}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Bắt đầu bài tập
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.push('/device-recommendation')}
            style={styles.button}
          >
            Bỏ qua, đến gợi ý thiết bị
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  insights: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  exerciseContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  priorityBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    zIndex: 10,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
