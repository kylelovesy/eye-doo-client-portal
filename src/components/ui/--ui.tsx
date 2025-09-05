// import * as React from "react"
// import { type ClassValue, clsx } from "clsx"
// import { twMerge } from "tailwind-merge"
// import * as AccordionPrimitive from "@radix-ui/react-accordion"
// import { cva, type VariantProps } from "class-variance-authority"
// import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
// import * as DialogPrimitive from "@radix-ui/react-dialog"
// import * as LabelPrimitive from "@radix-ui/react-label"
// import * as ProgressPrimitive from "@radix-ui/react-progress"
// import * as SelectPrimitive from "@radix-ui/react-select"
// import { Slot } from "@radix-ui/react-slot"

// //- UTILS

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs))
// }


// //- ACCORDION

// const Accordion = AccordionPrimitive.Root

// const AccordionItem = React.forwardRef<
//   React.ElementRef<typeof AccordionPrimitive.Item>,
//   React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
// >(({ className, ...props }, ref) => (
//   <AccordionPrimitive.Item
//     ref={ref}
//     className={cn("border-b", className)}
//     {...props}
//   />
// ))
// AccordionItem.displayName = "AccordionItem"

// const AccordionTrigger = React.forwardRef<
//   React.ElementRef<typeof AccordionPrimitive.Trigger>,
//   React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
// >(({ className, children, ...props }, ref) => (
//   <AccordionPrimitive.Header className="flex">
//     <AccordionPrimitive.Trigger
//       ref={ref}
//       className={cn(
//         "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
//         className
//       )}
//       {...props}
//     >
//       {children}
//       <ChevronDownIcon
//         className="h-4 w-4 shrink-0 transition-transform duration-200"
//       />
//     </AccordionPrimitive.Trigger>
//   </AccordionPrimitive.Header>
// ))
// AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

// const AccordionContent = React.forwardRef<
//   React.ElementRef<typeof AccordionPrimitive.Content>,
//   React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
// >(({ className, children, ...props }, ref) => (
//   <AccordionPrimitive.Content
//     ref={ref}
//     className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
//     {...props}
//   >
//     <div className={cn("pb-4 pt-0", className)}>{children}</div>
//   </AccordionPrimitive.Content>
// ))
// AccordionContent.displayName = AccordionPrimitive.Content.displayName

// export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }


// //- ALERT

// const alertVariants = cva(
//   "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
//   {
//     variants: {
//       variant: {
//         default: "bg-background text-foreground",
//         destructive:
//           "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
//         success: 
//           "border-green-500/50 text-green-700 bg-green-50 dark:border-green-500 [&>svg]:text-green-500",
//         warning:
//             "border-yellow-500/50 text-yellow-700 bg-yellow-50 dark:border-yellow-500 [&>svg]:text-yellow-500",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//     },
//   }
// )

// const Alert = React.forwardRef<
//   HTMLDivElement,
//   React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
// >(({ className, variant, ...props }, ref) => (
//   <div
//     ref={ref}
//     role="alert"
//     className={cn(alertVariants({ variant }), className)}
//     {...props}
//   />
// ))
// Alert.displayName = "Alert"

// const AlertTitle = React.forwardRef<
//   HTMLParagraphElement,
//   React.HTMLAttributes<HTMLHeadingElement>
// >(({ className, ...props }, ref) => (
//   <h5
//     ref={ref}
//     className={cn("mb-1 font-medium leading-none tracking-tight", className)}
//     {...props}
//   />
// ))
// AlertTitle.displayName = "AlertTitle"

// const AlertDescription = React.forwardRef<
//   HTMLParagraphElement,
//   React.HTMLAttributes<HTMLParagraphElement>
// >(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     className={cn("text-sm [&_p]:leading-relaxed", className)}
//     {...props}
//   />
// ))
// AlertDescription.displayName = "AlertDescription"

// export { Alert, AlertTitle, AlertDescription }


// //- BADGE

// const badgeVariants = cva(
//   "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
//   {
//     variants: {
//       variant: {
//         default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
//         secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
//         destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
//         outline: "text-foreground",
//         complete: "border-transparent bg-green-100 text-green-800",
//         pending: "border-transparent bg-yellow-100 text-yellow-800",
//         inProgress: "border-transparent bg-blue-100 text-blue-800",
//         notStarted: "border-transparent bg-gray-100 text-gray-800",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//     },
//   }
// )

// export interface BadgeProps
//   extends React.HTMLAttributes<HTMLDivElement>,
//     VariantProps<typeof badgeVariants> {}

// function Badge({ className, variant, ...props }: BadgeProps) {
//   return (
//     <div className={cn(badgeVariants({ variant }), className)} {...props} />
//   )
// }
// export { Badge, badgeVariants }

// //- BUTTON

// const buttonVariants = cva(
//   "inline-flex items-center justify-center font-body whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
//   {
//     variants: {
//       variant: {
//         default: "bg-primary text-primary-foreground hover:bg-primary/90",
//         destructive:
//           "bg-destructive text-destructive-foreground hover:bg-destructive/90",
//         outline:
//           "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
//         secondary:
//           "bg-secondary text-secondary-foreground hover:bg-secondary/80",
//         ghost: "hover:bg-accent hover:text-accent-foreground",
//         link: "text-primary underline-offset-4 hover:underline",
//       },
//       size: {
//         default: "h-6 px-4 py-2",
//         sm: "h-9 rounded-md px-3",
//         lg: "h-11 rounded-md px-8",
//         icon: "h-10 w-10",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//       size: "default",
//     },
//   }
// )

// export interface ButtonProps
//   extends React.ButtonHTMLAttributes<HTMLButtonElement>,
//     VariantProps<typeof buttonVariants> {
//   asChild?: boolean
// }

// const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
//   ({ className, variant, size, asChild = false, ...props }, ref) => {
//     const Comp = asChild ? Slot : "button"
//     return (
//       <Comp
//         className={cn(buttonVariants({ variant, size, className }))}
//         ref={ref}
//         {...props}
//       />
//     )
//   }
// )
// Button.displayName = "Button"

// export { Button, buttonVariants }

// //- CARD

// const Card = React.forwardRef<
//   HTMLDivElement,
//   React.HTMLAttributes<HTMLDivElement>
// >(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     className={cn(
//       "rounded-lg border bg-card text-card-foreground shadow-sm",
//       className
//     )}
//     {...props}
//   />
// ))
// Card.displayName = "Card"

// const CardHeader = React.forwardRef<
//   HTMLDivElement,
//   React.HTMLAttributes<HTMLDivElement>
// >(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     className={cn("flex flex-col space-y-1.5 p-6", className)}
//     {...props}
//   />
// ))
// CardHeader.displayName = "CardHeader"

// const CardTitle = React.forwardRef<
//   HTMLParagraphElement,
//   React.HTMLAttributes<HTMLHeadingElement>
// >(({ className, ...props }, ref) => (
//   <h3
//     ref={ref}
//     className={cn(
//       "text-2xl font-semibold leading-none tracking-tight",
//       className
//     )}
//     {...props}
//   />
// ))
// CardTitle.displayName = "CardTitle"

// const CardDescription = React.forwardRef<
//   HTMLParagraphElement,
//   React.HTMLAttributes<HTMLParagraphElement>
// >(({ className, ...props }, ref) => (
//   <p
//     ref={ref}
//     className={cn("text-sm text-muted-foreground", className)}
//     {...props}
//   />
// ))
// CardDescription.displayName = "CardDescription"

// const CardContent = React.forwardRef<
//   HTMLDivElement,
//   React.HTMLAttributes<HTMLDivElement>
// >(({ className, ...props }, ref) => (
//   <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
// ))
// CardContent.displayName = "CardContent"

// const CardFooter = React.forwardRef<
//   HTMLDivElement,
//   React.HTMLAttributes<HTMLDivElement>
// >(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     className={cn("flex items-center p-6 pt-0", className)}
//     {...props}
//   />
// ))
// CardFooter.displayName = "CardFooter"

// export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }


// //- CHECKBOX

// const Checkbox = React.forwardRef<
//   React.ElementRef<typeof CheckboxPrimitive.Root>,
//   React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
// >(({ className, ...props }, ref) => (
//   <CheckboxPrimitive.Root
//     ref={ref}
//     className={cn(
//       "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
//       className
//     )}
//     {...props}
//   >
//     <CheckboxPrimitive.Indicator
//       className={cn("flex items-center justify-center text-current")}
//     >
//         <CheckIcon className="h-4 w-4" />
//     </CheckboxPrimitive.Indicator>
//   </CheckboxPrimitive.Root>
// ))
// Checkbox.displayName = CheckboxPrimitive.Root.displayName

// export { Checkbox }

// //- DIALOG

// const Dialog = DialogPrimitive.Root

// const DialogTrigger = DialogPrimitive.Trigger

// const DialogPortal = DialogPrimitive.Portal

// const DialogClose = DialogPrimitive.Close

// const DialogOverlay = React.forwardRef<
//   React.ElementRef<typeof DialogPrimitive.Overlay>,
//   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
// >(({ className, ...props }, ref) => (
//   <DialogPrimitive.Overlay
//     ref={ref}
//     className={cn(
//       "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
//       className
//     )}
//     {...props}
//   />
// ))
// DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// const DialogContent = React.forwardRef<
//   React.ElementRef<typeof DialogPrimitive.Content>,
//   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
// >(({ className, children, ...props }, ref) => (
//   <DialogPortal>
//     <DialogOverlay />
//     <DialogPrimitive.Content
//       ref={ref}
//       className={cn(
//         "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
//         className
//       )}
//       {...props}
//     >
//       {children}
//       <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
//         <Cross2Icon className="h-4 w-4" />
//         <span className="sr-only">Close</span>
//       </DialogPrimitive.Close>
//     </DialogPrimitive.Content>
//   </DialogPortal>
// ))
// DialogContent.displayName = DialogPrimitive.Content.displayName

// const DialogHeader = ({
//   className,
//   ...props
// }: React.HTMLAttributes<HTMLDivElement>) => (
//   <div
//     className={cn(
//       "flex flex-col space-y-1.5 text-center sm:text-left",
//       className
//     )}
//     {...props}
//   />
// )
// DialogHeader.displayName = "DialogHeader"

// const DialogFooter = ({
//   className,
//   ...props
// }: React.HTMLAttributes<HTMLDivElement>) => (
//   <div
//     className={cn(
//       "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
//       className
//     )}
//     {...props}
//   />
// )
// DialogFooter.displayName = "DialogFooter"

// const DialogTitle = React.forwardRef<
//   React.ElementRef<typeof DialogPrimitive.Title>,
//   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
// >(({ className, ...props }, ref) => (
//   <DialogPrimitive.Title
//     ref={ref}
//     className={cn(
//       "text-lg leading-none tracking-tight",
//       className
//     )}
//     {...props}
//   />
// ))
// DialogTitle.displayName = DialogPrimitive.Title.displayName

// const DialogDescription = React.forwardRef<
//   React.ElementRef<typeof DialogPrimitive.Description>,
//   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
// >(({ className, ...props }, ref) => (
//   <DialogPrimitive.Description
//     ref={ref}
//     className={cn("text-sm text-muted-foreground", className)}
//     {...props}
//   />
// ))
// DialogDescription.displayName = DialogPrimitive.Description.displayName

// export {
//   Dialog,
//   DialogPortal,
//   DialogOverlay,
//   DialogClose,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogFooter,
//   DialogTitle,
//   DialogDescription,
// }


// //- INPUT

// export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

// const Input = React.forwardRef<HTMLInputElement, InputProps>(
//   ({ className, type, ...props }, ref) => {
//     return (
//       <input
//         type={type}
//         className={cn(
//           "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
//           className
//         )}
//         ref={ref}
//         {...props}
//       />
//     )
//   }
// )
// Input.displayName = "Input"

// export { Input }

// //- LABEL

// const Label = React.forwardRef<
//   React.ElementRef<typeof LabelPrimitive.Root>,
//   React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
// >(({ className, ...props }, ref) => (
//   <LabelPrimitive.Root
//     ref={ref}
//     className={cn(
//       "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
//       className
//     )}
//     {...props}
//   />
// ))
// Label.displayName = LabelPrimitive.Root.displayName

// export { Label }


// //- PROGRESS

// const Progress = React.forwardRef<
//   React.ElementRef<typeof ProgressPrimitive.Root>,
//   React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
// >(({ className, value, ...props }, ref) => (
//   <ProgressPrimitive.Root
//     ref={ref}
//     className={cn(
//       "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
//       className
//     )}
//     {...props}
//   >
//     <ProgressPrimitive.Indicator
//       className="h-full w-full flex-1 bg-primary transition-all"
//       style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
//     />
//   </ProgressPrimitive.Root>
// ))
// Progress.displayName = ProgressPrimitive.Root.displayName

// export { Progress }

// //- SELECT

// const Select = SelectPrimitive.Root

// const SelectGroup = SelectPrimitive.Group

// const SelectValue = SelectPrimitive.Value

// const SelectTrigger = React.forwardRef<
//   React.ElementRef<typeof SelectPrimitive.Trigger>,
//   React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
// >(({ className, children, ...props }, ref) => (
//   <SelectPrimitive.Trigger
//     ref={ref}
//     className={cn(
//       "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
//       className
//     )}
//     {...props}
//   >
//     {children}
//     <SelectPrimitive.Icon asChild>
//       <CaretSortIcon className="h-4 w-4 opacity-50" />
//     </SelectPrimitive.Icon>
//   </SelectPrimitive.Trigger>
// ))
// SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

// const SelectContent = React.forwardRef<
//   React.ElementRef<typeof SelectPrimitive.Content>,
//   React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
// >(({ className, children, position = "popper", ...props }, ref) => (
//   <SelectPrimitive.Portal>
//     <SelectPrimitive.Content
//       ref={ref}
//       className={cn(
//         "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
//         position === "popper" &&
//           "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
//         className
//       )}
//       position={position}
//       {...props}
//     >
//       <SelectPrimitive.Viewport
//         className={cn(
//           "p-1",
//           position === "popper" &&
//             "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
//         )}
//       >
//         {children}
//       </SelectPrimitive.Viewport>
//     </SelectPrimitive.Content>
//   </SelectPrimitive.Portal>
// ))
// SelectContent.displayName = SelectPrimitive.Content.displayName

// const SelectLabel = React.forwardRef<
//   React.ElementRef<typeof SelectPrimitive.Label>,
//   React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
// >(({ className, ...props }, ref) => (
//   <SelectPrimitive.Label
//     ref={ref}
//     className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
//     {...props}
//   />
// ))
// SelectLabel.displayName = SelectPrimitive.Label.displayName

// const SelectItem = React.forwardRef<
//   React.ElementRef<typeof SelectPrimitive.Item>,
//   React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
// >(({ className, children, ...props }, ref) => (
//   <SelectPrimitive.Item
//     ref={ref}
//     className={cn(
//       "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
//       className
//     )}
//     {...props}
//   >
//     <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
//       <SelectPrimitive.ItemIndicator>
//         <CheckIcon className="h-4 w-4" />
//       </SelectPrimitive.ItemIndicator>
//     </span>

//     <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
//   </SelectPrimitive.Item>
// ))
// SelectItem.displayName = SelectPrimitive.Item.displayName

// const SelectSeparator = React.forwardRef<
//   React.ElementRef<typeof SelectPrimitive.Separator>,
//   React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
// >(({ className, ...props }, ref) => (
//   <SelectPrimitive.Separator
//     ref={ref}
//     className={cn("-mx-1 my-1 h-px bg-muted", className)}
//     {...props}
//   />
// ))
// SelectSeparator.displayName = SelectPrimitive.Separator.displayName

// export {
//   Select,
//   SelectGroup,
//   SelectValue,
//   SelectTrigger,
//   SelectContent,
//   SelectLabel,
//   SelectItem,
//   SelectSeparator,
// }

// //- TEXTAREA

// export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

// const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
//   ({ className, ...props }, ref) => {
//     return (
//       <textarea
//         className={cn(
//           "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
//           className
//         )}
//         ref={ref}
//         {...props}
//       />
//     )
//   }
// )
// Textarea.displayName = "Textarea"

// export { Textarea }


// //- ICONS (inlined to avoid dependencies)

// const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
//         <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
//     </svg>
// );

// const Cross2Icon = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor" {...props}>
//         <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.5 6.68688L4.03157 3.2184C3.80702 2.99385 3.44295 2.99385 3.2184 3.2184C2.99385 3.44295 2.99385 3.80702 3.2184 4.03157L6.68688 7.5L3.2184 10.9685C2.99385 11.193 2.99385 11.5571 3.2184 11.7816C3.44295 12.0062 3.80702 12.0062 4.03157 11.7816L7.5 8.31312L10.9685 11.7816C11.193 12.0062 11.5571 12.0062 11.7816 11.7816C12.0062 11.5571 12.0062 11.193 11.7816 10.9685L8.31312 7.5L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
//     </svg>
// );

// const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor" {...props}>
//         <path fillRule="evenodd" clipRule="evenodd" d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.2978 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2175L3.35446 8.71753C3.12239 8.52331 3.09015 8.1882 3.28437 7.95613C3.47859 7.72406 3.8137 7.69182 4.04577 7.88604L6.90228 9.94159L10.9542 4.00802C11.1431 3.71912 11.5304 3.63798 11.8193 3.82688C12.1082 4.01578 12.1893 4.40312 12.0004 4.69202L7.75045 11.192C7.56155 11.4809 7.17421 11.562 6.88531 11.3731L3.78531 8.8731C3.55324 8.67888 3.21813 8.71112 3.02391 8.94319C2.82969 9.17526 2.86193 9.51037 3.094 9.70459L6.194 12.2046C6.46363 12.4145 6.82229 12.4548 7.12767 12.3023L11.3777 5.80234C11.5666 5.51344 11.4854 5.1261 11.1965 4.9372C10.9076 4.7483 10.5203 4.82944 10.3314 5.11834L6.94944 10.5186L4.25423 8.32684C3.99127 8.11334 3.62319 8.14448 3.40969 8.40744C3.19619 8.6704 3.22733 9.03848 3.49029 9.25198L6.1855 11.4437L10.5458 5.30802C10.7347 5.01912 11.1221 4.93798 11.411 5.12688C11.7001 5.31578 11.7812 5.70312 11.5922 5.99202L7.14221 12.242C6.98971 12.4757 6.69018 12.5358 6.45648 12.3833L3.35648 9.88331C3.01811 9.61933 2.94539 9.14365 3.20937 8.80528C3.47335 8.46691 3.94903 8.39419 4.2874 8.65817L6.89772 10.6937L11.2669 4.27316C11.4558 3.98426 11.3747 3.59692 11.0858 3.40802C10.7969 3.21912 10.4095 3.30026 10.2206 3.58916L6.26871 9.52272L4.14577 7.78604C3.9137 7.59182 3.57859 7.62406 3.38437 7.85613C3.19015 8.0882 3.22239 8.42331 3.45446 8.61753L6.55446 11.1175C6.75932 11.2841 7.03133 11.3283 7.26867 11.2335L11.648 4.59198C11.8369 4.30308 11.7558 3.91574 11.4669 3.72684Z"></path>
//     </svg>
// );

// const CaretSortIcon = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="currentColor" {...props}>
//         <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64248 10.8182 6.81821L7.81819 9.81821C7.64245 9.99395 7.35753 9.99395 7.18179 9.81821L4.18179 6.81821C4.00605 6.64248 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
//     </svg>
// );

