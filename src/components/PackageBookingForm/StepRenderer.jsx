/**
 * StepRenderer — pregunta + switch del tipo de paso hacia su componente.
 * Todos los pasos comparten la misma API:
 * { step, value, onChange, onSelect, onAdvance, onEdit, onConfirm, stepList, error }
 */
import SelectSingleStep from "./steps/SelectSingleStep";
import TextInputStep from "./steps/TextInputStep";
import TextareaStep from "./steps/TextareaStep";
import DatePickerStep from "./steps/DatePickerStep";
import SummaryStep from "./steps/SummaryStep";

export default function StepRenderer({ step, stepList, answers, ...props }) {
	if (!step) return null;

	let content = null;

	switch (step.type) {
		case "select_single":
			content = <SelectSingleStep step={step} {...props} />;
			break;
		case "text_input":
			content = <TextInputStep step={step} {...props} />;
			break;
		case "textarea_input":
			content = <TextareaStep step={step} {...props} />;
			break;
		case "date_picker":
			content = <DatePickerStep step={step} {...props} />;
			break;
		case "summary_step":
			content = (
				<SummaryStep
					step={step}
					steps={stepList}
					answers={answers}
					{...props}
				/>
			);
			break;
		default:
			content = null;
	}

	return (
		<div className="flex w-full flex-col gap-6">
			<h2
				data-stagger
				className="max-w-2xl text-2xl font-semibold leading-snug text-foreground sm:text-3xl"
			>
				{step.question}
			</h2>
			{content}
		</div>
	);
}
