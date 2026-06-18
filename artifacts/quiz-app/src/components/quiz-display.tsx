import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Question } from "@workspace/api-client-react";
import { Image as ImageIcon, Lightbulb, CheckCircle2 } from "lucide-react";
import { RenderMath, RenderEquation } from "./render-math";

export function QuizDisplay({ questions }: { questions: Question[] }) {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 mt-8">
      <h2 className="text-2xl font-bold border-b pb-2">Generated Questions ({questions.length})</h2>

      {questions.map((q, index) => (
        <Card key={q.id || index} className="overflow-hidden border-border/60">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-lg font-medium leading-relaxed">
                <span className="text-muted-foreground mr-2">{index + 1}.</span>
                <RenderMath text={q.question} />
              </CardTitle>
              <Badge
                variant={
                  q.difficulty === 'hard' ? 'destructive' :
                  q.difficulty === 'medium' ? 'secondary' : 'default'
                }
                className="shrink-0 capitalize"
              >
                {q.difficulty}
              </Badge>
            </div>

            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="capitalize text-xs font-normal">
                {q.type.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">

            {/* Diagram Description */}
            {q.hasDiagram && q.diagramDescription && (
              <div className="flex gap-3 bg-secondary/30 border border-secondary p-4 rounded-md text-sm text-secondary-foreground">
                <ImageIcon className="w-5 h-5 shrink-0 text-muted-foreground mt-0.5" />
                <p className="italic">{q.diagramDescription}</p>
              </div>
            )}

            {/* Equations */}
            {q.hasEquation && q.equations && q.equations.length > 0 && (
              <div className="space-y-1 p-4 bg-muted/20 rounded-md">
                {q.equations.map((eq, i) => (
                  <RenderEquation key={i} equation={eq} />
                ))}
              </div>
            )}

            {/* MCQ Options */}
            {q.type === 'mcq' && q.options && q.options.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isCorrect = opt === q.correctAnswer;
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-md border ${isCorrect ? 'bg-primary/5 border-primary/30' : 'border-border'}`}
                    >
                      <span className={`font-medium min-w-[24px] shrink-0 ${isCorrect ? 'text-primary' : 'text-muted-foreground'}`}>
                        {letter}.
                      </span>
                      <span className={`flex-1 ${isCorrect ? 'font-medium' : ''}`}>
                        <RenderMath text={opt} />
                      </span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Answer & Explanation */}
            <div className="mt-6 pt-4 border-t space-y-4">
              {q.type !== 'mcq' && q.correctAnswer && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
                    Correct Answer
                  </h4>
                  <div className="font-medium">
                    <RenderMath text={q.correctAnswer} />
                  </div>
                </div>
              )}

              {q.explanation && (
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground uppercase tracking-wider mb-2">
                    <Lightbulb className="w-4 h-4" /> Explanation
                  </h4>
                  <div className="text-sm leading-relaxed bg-muted/40 p-4 rounded-md text-foreground">
                    <RenderMath text={q.explanation} />
                  </div>
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      ))}
    </div>
  );
}
