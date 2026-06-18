import { useState } from "react";
import { 
  useListBoards, useCreateBoard, useDeleteBoard, getListBoardsQueryKey,
  useListStandards, useCreateStandard, useDeleteStandard, getListStandardsQueryKey,
  useListSubjects, useCreateSubject, useDeleteSubject, getListSubjectsQueryKey,
  useListChapters, useCreateChapter, useDeleteChapter, getListChaptersQueryKey,
  useListTopics, useCreateTopic, useDeleteTopic, getListTopicsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, ChevronRight } from "lucide-react";

export default function ContentManager() {
  const queryClient = useQueryClient();
  
  const [selectedBoard, setSelectedBoard] = useState<number | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  // Queries
  const { data: boards, isLoading: isLoadingBoards } = useListBoards({ query: { queryKey: getListBoardsQueryKey() } });
  const { data: standards } = useListStandards({ boardId: selectedBoard || undefined }, { query: { enabled: !!selectedBoard, queryKey: getListStandardsQueryKey({ boardId: selectedBoard || undefined }) } });
  const { data: subjects } = useListSubjects({ standardId: selectedStandard || undefined }, { query: { enabled: !!selectedStandard, queryKey: getListSubjectsQueryKey({ standardId: selectedStandard || undefined }) } });
  const { data: chapters } = useListChapters({ subjectId: selectedSubject || undefined }, { query: { enabled: !!selectedSubject, queryKey: getListChaptersQueryKey({ subjectId: selectedSubject || undefined }) } });
  const { data: topics } = useListTopics({ chapterId: selectedChapter || undefined }, { query: { enabled: !!selectedChapter, queryKey: getListTopicsQueryKey({ chapterId: selectedChapter || undefined }) } });

  // Mutations
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();
  const createStandard = useCreateStandard();
  const deleteStandard = useDeleteStandard();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const createChapter = useCreateChapter();
  const deleteChapter = useDeleteChapter();
  const createTopic = useCreateTopic();
  const deleteTopic = useDeleteTopic();

  const handleCreate = (type: string, parentId: number | null) => {
    const name = window.prompt(`Enter new ${type} name:`);
    if (!name?.trim()) return;

    switch (type) {
      case 'board':
        createBoard.mutate({ data: { name } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListBoardsQueryKey() }) });
        break;
      case 'standard':
        if (parentId) createStandard.mutate({ data: { boardId: parentId, name } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListStandardsQueryKey({ boardId: parentId }) }) });
        break;
      case 'subject':
        if (parentId) createSubject.mutate({ data: { standardId: parentId, name } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey({ standardId: parentId }) }) });
        break;
      case 'chapter':
        if (parentId) createChapter.mutate({ data: { subjectId: parentId, name } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListChaptersQueryKey({ subjectId: parentId }) }) });
        break;
      case 'topic':
        if (parentId) createTopic.mutate({ data: { chapterId: parentId, name } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTopicsQueryKey({ chapterId: parentId }) }) });
        break;
    }
  };

  const handleDelete = (type: string, id: number, parentId?: number | null) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    switch (type) {
      case 'board':
        deleteBoard.mutate({ id }, { onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBoardsQueryKey() });
          if (selectedBoard === id) setSelectedBoard(null);
        }});
        break;
      case 'standard':
        deleteStandard.mutate({ id }, { onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStandardsQueryKey({ boardId: parentId || undefined }) });
          if (selectedStandard === id) setSelectedStandard(null);
        }});
        break;
      case 'subject':
        deleteSubject.mutate({ id }, { onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey({ standardId: parentId || undefined }) });
          if (selectedSubject === id) setSelectedSubject(null);
        }});
        break;
      case 'chapter':
        deleteChapter.mutate({ id }, { onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListChaptersQueryKey({ subjectId: parentId || undefined }) });
          if (selectedChapter === id) setSelectedChapter(null);
        }});
        break;
      case 'topic':
        deleteTopic.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTopicsQueryKey({ chapterId: parentId || undefined }) }) });
        break;
    }
  };

  const Panel = ({ title, items, selectedId, onSelect, onCreate, onDelete, emptyMsg }: any) => (
    <Card className="flex flex-col h-[600px] border-border shadow-sm">
      <CardHeader className="p-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCreate} className="h-6 w-6">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {!items || items.length === 0 ? (
            <div className="text-center p-4 text-xs text-muted-foreground italic">
              {emptyMsg}
            </div>
          ) : (
            items.map((item: any) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2 rounded-md text-sm cursor-pointer transition-colors ${
                  selectedId === item.id 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelect && onSelect(item.id)}
              >
                <span className="truncate pr-2">{item.name}</span>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 ${selectedId === item.id ? "text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground" : "text-muted-foreground hover:text-destructive"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  {onSelect && (
                    <ChevronRight className={`h-4 w-4 ${selectedId === item.id ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Content Manager</h1>
        <p className="text-muted-foreground mt-2">Manage your curriculum hierarchy. Select a parent item to manage its children.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Panel 
          title="Boards" 
          items={boards} 
          selectedId={selectedBoard} 
          onSelect={(id: number) => { setSelectedBoard(id); setSelectedStandard(null); setSelectedSubject(null); setSelectedChapter(null); }} 
          onCreate={() => handleCreate('board', null)}
          onDelete={(id: number) => handleDelete('board', id)}
          emptyMsg="No boards"
        />
        <Panel 
          title="Standards" 
          items={standards} 
          selectedId={selectedStandard} 
          onSelect={(id: number) => { setSelectedStandard(id); setSelectedSubject(null); setSelectedChapter(null); }} 
          onCreate={() => handleCreate('standard', selectedBoard)}
          onDelete={(id: number) => handleDelete('standard', id, selectedBoard)}
          emptyMsg={selectedBoard ? "No standards" : "Select a board first"}
        />
        <Panel 
          title="Subjects" 
          items={subjects} 
          selectedId={selectedSubject} 
          onSelect={(id: number) => { setSelectedSubject(id); setSelectedChapter(null); }} 
          onCreate={() => handleCreate('subject', selectedStandard)}
          onDelete={(id: number) => handleDelete('subject', id, selectedStandard)}
          emptyMsg={selectedStandard ? "No subjects" : "Select a standard first"}
        />
        <Panel 
          title="Chapters" 
          items={chapters} 
          selectedId={selectedChapter} 
          onSelect={(id: number) => setSelectedChapter(id)} 
          onCreate={() => handleCreate('chapter', selectedSubject)}
          onDelete={(id: number) => handleDelete('chapter', id, selectedSubject)}
          emptyMsg={selectedSubject ? "No chapters" : "Select a subject first"}
        />
        <Panel 
          title="Topics" 
          items={topics} 
          onCreate={() => handleCreate('topic', selectedChapter)}
          onDelete={(id: number) => handleDelete('topic', id, selectedChapter)}
          emptyMsg={selectedChapter ? "No topics" : "Select a chapter first"}
        />
      </div>
    </div>
  );
}
