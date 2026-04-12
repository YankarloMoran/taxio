import { SelectProps } from "@radix-ui/react-select"
import { FormSelect } from "./simple"

export const FormSelectType = ({
  title,
  emptyValue,
  placeholder,
  hideIfEmpty = false,
  isRequired = false,
  ...props
}: {
  title: string
  emptyValue?: string
  placeholder?: string
  hideIfEmpty?: boolean
  isRequired?: boolean
} & SelectProps) => {
  const items = [
    { code: "expense", name: "Expense", badge: "â†“" },
    { code: "income", name: "Income", badge: "â†‘" },
    { code: "pending", name: "Pending", badge: "â²ï¸Ž" },
    { code: "other", name: "Other", badge: "?" },
  ]

  return (
    <FormSelect
      title={title}
      items={items}
      emptyValue={emptyValue}
      placeholder={placeholder}
      hideIfEmpty={hideIfEmpty}
      isRequired={isRequired}
      {...props}
    />
  )
}
