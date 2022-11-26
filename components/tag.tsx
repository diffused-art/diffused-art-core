interface TagProps {
    name: string;
    count: string;
}

export default function Tag(props:TagProps) {
    return (
        <div className='tag flex bg-primary uppercase rounded-md text-base px-2 py-0.5 border-2 border-white border-opacity-0 hover:border-white hover:border-opacity-30 transition-all duration-200 ease-in-out cursor-pointer flex-initial'>
            <a href='#'>
            <span className='tag-name'>
              {props.name}
            </span>
            <span className='tag-count opacity-50 ml-2'>
                {props.count}
            </span>
            </a>
          </div>
    )
}