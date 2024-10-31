export const InfoTask = ({ name, value }: { name: string; value: number }) => {
  return (
    <div className="shadow-md backdrop-blur-md p-2 md:p-5 flex flex-col justify-center items-center rounded-md">
      <span className="text-4xl text-[#272727] text-opacity-[0.86]">
        {value}
      </span>
      <p className="text-[#272727] text-opacity-[0.86]">{name}</p>
    </div>
  );
};
