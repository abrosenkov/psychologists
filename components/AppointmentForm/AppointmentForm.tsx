import { Psychologist } from "@/types/psychologist";

interface AppointmentFormProps {
  psychologist: Psychologist;
}

export default function AppointmentForm({
  psychologist,
}: AppointmentFormProps) {
  console.log(psychologist);
  return <div>AppointmentForm</div>;
}
