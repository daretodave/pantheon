import { Bullet } from '@/components/atoms/Bullet'

type CommunityWeeklyQuestionCardProps = {
  question: string | null | undefined
}

const DEFAULT_QUESTION = 'Which season are you defending tonight?'

export function CommunityWeeklyQuestionCard({
  question,
}: CommunityWeeklyQuestionCardProps) {
  const q = question ?? DEFAULT_QUESTION
  return (
    <div
      className="cp-cq-card"
      data-testid="community-weekly-question"
      data-default={question ? 'false' : 'true'}
    >
      <div>
        <div className="cp-cq-key">
          <Bullet color="var(--show-primary)" size={8} />
          this week&rsquo;s question
        </div>
        <div className="cp-cq-q">{q}</div>
        <div className="cp-cq-help">
          Your vote feeds the next recompute. One vote per reader; change your mind within
          72h.
        </div>
      </div>
      <div className="cp-cq-cta">
        <span className="cp-cq-meta">closes when votes flow</span>
      </div>
    </div>
  )
}
