import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Database, FolderTree, Layers, ListTree, HelpCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of your curriculum and generated quizzes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const overviewCards = [
    { title: "Boards", value: stats?.totalBoards || 0, icon: Database, desc: "Curriculum boards" },
    { title: "Standards", value: stats?.totalStandards || 0, icon: Layers, desc: "Grade levels" },
    { title: "Subjects", value: stats?.totalSubjects || 0, icon: BookOpen, desc: "Subjects taught" },
    { title: "Chapters", value: stats?.totalChapters || 0, icon: FolderTree, desc: "Total chapters" },
    { title: "Topics", value: stats?.totalTopics || 0, icon: ListTree, desc: "Granular topics" },
    { title: "Quizzes", value: stats?.totalQuizzes || 0, icon: HelpCircle, desc: "Generated so far", highlight: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your curriculum and generated quizzes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {overviewCards.map((card) => (
          <Card key={card.title} className={card.highlight ? "border-primary/50 shadow-md bg-primary/5" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.highlight ? "text-primary" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${card.highlight ? "text-primary" : ""}`}>{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Quizzes</h2>
        {stats?.recentQuizzes && stats.recentQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.recentQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{quiz.topicName}</CardTitle>
                  <CardDescription>
                    {quiz.boardName} &bull; {quiz.standardName} &bull; {quiz.subjectName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium bg-muted px-2 py-1 rounded">
                      {quiz.questionCount} Questions
                    </span>
                    <span className="capitalize text-muted-foreground border px-2 py-1 rounded">
                      {quiz.difficulty}
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(quiz.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border rounded-xl border-dashed bg-muted/30">
            <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium text-foreground">No quizzes generated yet</h3>
            <p className="text-muted-foreground mt-1">Go to the Generator tab to create your first quiz.</p>
          </div>
        )}
      </div>
    </div>
  );
}
