import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuestionInput {
  id: number;
  text: string;
  type: string;
  options: unknown;
}

interface QuestionInputCardProps {
  question: QuestionInput;
  index: number;
  userAnswer: string | undefined;
  onAnswerChange: (questionId: number, answer: string) => void;
}

const QuestionInputCard = memo(
  ({ question, index, userAnswer, onAnswerChange }: QuestionInputCardProps) => {
    const options = (question.options as string[]) || [];
    const isIdentification = question.type === "IDENTIFICATION";
    const isTrueFalse = question.type === "TRUE_FALSE";

    return (
      <Card
        className={cn(
          "p-5 transition-all border-2",
          userAnswer
            ? "border-primary/30 bg-primary/5"
            : "border-gray-200 dark:border-gray-700"
        )}
      >
        <div className="flex items-start gap-3 mb-4">
          <span
            className={cn(
              "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
              userAnswer
                ? "bg-primary text-primary-foreground"
                : "bg-gray-200 dark:bg-gray-700 text-muted-foreground"
            )}
          >
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white leading-relaxed">
              {question.text}
            </p>
            <Badge variant="outline" className="mt-2 text-xs">
              {question.type.replace("_", " ").toLowerCase()}
            </Badge>
          </div>
        </div>

        {isIdentification ? (
          <input
            type="text"
            value={userAnswer || ""}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            placeholder="Type your answer..."
            className="w-full p-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-800 dark:border-gray-600"
          />
        ) : isTrueFalse ? (
          <div className="flex gap-3">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => onAnswerChange(question.id, option)}
                className={cn(
                  "flex-1 px-4 py-3 rounded-lg font-medium transition-all border-2",
                  userAnswer === option
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {options.map((option, optIndex) => (
              <button
                key={optIndex}
                onClick={() => onAnswerChange(question.id, option)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg text-sm transition-all border-2",
                  userAnswer === option
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <span className="font-medium mr-2">
                  {String.fromCharCode(65 + optIndex)}.
                </span>
                {option}
              </button>
            ))}
          </div>
        )}
      </Card>
    );
  }
);

QuestionInputCard.displayName = "QuestionInputCard";

export default QuestionInputCard;
