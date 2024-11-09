type Skill = {
    icon: string;
  };

type Props = {
    skills: Skill[]
}

export default function Skill(skills: Props) {
    const SKILLS = skills.skills
    return (
        <ul className="flex flex-wrap justify-center my-2">
            {SKILLS.map((skill, index) => (
                <img key={index} className="m-0.5" src={skill.icon} alt="skill" />
            ))}
        </ul>
    )
}