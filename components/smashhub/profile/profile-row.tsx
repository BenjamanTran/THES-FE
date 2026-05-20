export function ProfileRow({
  icon,
  label,
  value,
  muted,
}: {
  icon: React.ReactNode
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="w-8 h-8 rounded-full bg-secondary/60 text-muted-foreground flex items-center justify-center">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={"text-sm font-medium truncate " + (muted ? "text-muted-foreground" : "")}>
          {value}
        </p>
      </div>
    </li>
  )
}
