type Props = {
    title: string;
    value: string | number;
    setValue: (val: string) => void;
    inputType?: string;
}

export const Input = ({title, value, setValue, inputType = 'text'}: Props) => {
    
    return (
        <div className="flex flex-col mb-5">
            <span>{title}</span>
            <input type={inputType} value={value} onChange={(val) => setValue(val.currentTarget.value)} />
        </div>
    )
}